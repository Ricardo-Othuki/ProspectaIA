/**
 * Lead Radar - varre grupos de WhatsApp em busca de pedidos reais de
 * serviços vendidos pela Othuki, com o mínimo de custo de IA possível:
 * 1) prefiltro local por palavra-chave (0 tokens) antes de qualquer coisa;
 * 2) só as mensagens candidatas vão para classificação por IA, em lote;
 * 3) modelo dedicado mais barato (LEAD_RADAR_MODEL), separado do modelo do
 *    agente de vendas;
 * 4) cursor por grupo para nunca reprocessar a mesma mensagem.
 */

require('dotenv').config();
const WhatsAppIntegration = require('./whatsappIntegration');
const { LeadRadarGroupsStore } = require('./leadRadarGroupsStore');
const leadRadarStore = require('./leadRadarStore');
const { getProfile } = require('./businessProfile');
const { getClient } = require('./openaiClient');
const { sendOwnerAlert } = require('./alerts');
const events = require('./events');
const { SettingsStore } = require('./settingsStore');

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const BATCH_SIZE = 20;
const VALID_PRIORITIES = new Set(['alta', 'media', 'baixa']);

const GENERIC_KEYWORDS = [
    'site', 'automação', 'automacao', 'agente de ia', 'agente de inteligencia artificial',
    'chatbot', 'atendimento automático', 'atendimento automatico', 'tráfego pago', 'trafego pago',
    'anúncios', 'anuncios', 'landing page', 'seo', 'saas', 'sistema sob medida', 'aplicativo',
    'whatsapp bot', 'inteligência artificial', 'inteligencia artificial'
];

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

function extractText(record) {
    const m = record.message || {};
    return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
}

class LeadRadar {
    constructor() {
        this.whatsapp = new WhatsAppIntegration();
        this.groupsStore = new LeadRadarGroupsStore();
        this._keywordsCache = null;
        this._pollerStarted = false;
    }

    buildKeywordFilter() {
        if (this._keywordsCache) return this._keywordsCache;
        const biz = (getProfile().business) || {};
        const raw = [...(biz.services || []), ...(biz.valuePropositions || []), ...GENERIC_KEYWORDS];
        this._keywordsCache = Array.from(new Set(raw.map(normalize).filter(Boolean)));
        return this._keywordsCache;
    }

    matchesPrefilter(text) {
        const normalized = normalize(text);
        if (!normalized) return false;
        return this.buildKeywordFilter().some(keyword => normalized.includes(keyword));
    }

    async classifyBatch(candidates) {
        if (!candidates.length) return [];

        const client = getClient();
        if (!client) return candidates.map(() => ({ isLead: false }));

        const model = process.env.LEAD_RADAR_MODEL || DEFAULT_MODEL;
        const biz = (getProfile().business) || {};
        const services = (biz.services && biz.services.length)
            ? biz.services.join(', ')
            : 'sites, automação com IA, agentes de IA, tráfego pago, SEO, SaaS sob medida';

        const prompt = `Você filtra mensagens de grupos de WhatsApp para achar pedidos reais de serviços que a ${biz.name || 'Othuki'} vende: ${services}.

Para cada mensagem abaixo (array JSON com "index" e "text"), diga se é um PEDIDO REAL de algum desses serviços (não conta menção casual, propaganda de terceiros, nem oferta de quem vende o mesmo serviço).

Responda APENAS com um array JSON, um item por mensagem, nesta forma exata:
[{"index":0,"isLead":true,"priority":"alta","serviceMatch":"agente de IA","needSummary":"resumo curto do que a pessoa precisa","reason":"por que é relevante"}]

"priority" é "alta" (pediu preço/quer contratar agora), "media" (interesse claro, sem urgência) ou "baixa" (mencionou o tema de forma vaga). Se não for um pedido real, retorne isLead:false para aquele index (os outros campos podem ficar vazios).

MENSAGENS:
${JSON.stringify(candidates.map((c, i) => ({ index: i, text: c.text })))}`;

        try {
            const completion = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: 'Você responde só com JSON válido, sem markdown, sem texto extra.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200 + candidates.length * 120,
                temperature: 0.2,
                reasoning_effort: 'none'
            });

            const raw = completion.choices[0].message.content.trim()
                .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
            const parsed = JSON.parse(raw);
            const byIndex = new Map(parsed.map(p => [p.index, p]));
            return candidates.map((_, i) => byIndex.get(i) || { isLead: false });
        } catch (error) {
            console.error('Erro ao classificar lote de mensagens do radar:', error.message);
            return candidates.map(() => ({ isLead: false }));
        }
    }

    /**
     * Configuração de canais de alerta: preferência salva no painel
     * (data/dashboard-settings.json, não secreta), com fallback para o
     * .env — o token do bot do Telegram é sempre lido só do .env (segredo).
     */
    async sendAlerts(lead) {
        const text = `🎯 Lead detectado (${lead.priority})\nGrupo: ${lead.group_name || lead.group_id}\nQuem: ${lead.sender_name || 'desconhecido'}\nPrecisa de: ${lead.need_summary || lead.service_match || '-'}\nMensagem: "${(lead.message_text || '').slice(0, 200)}"`;
        await sendOwnerAlert(text);
    }

    async persistIfLead({ groupId, groupName, record, text, classification }) {
        if (!classification || !classification.isLead) return null;

        const lead = await leadRadarStore.insertLeadIfNew({
            messageId: record.key?.id || `${groupId}_${record.messageTimestamp}`,
            groupId,
            groupName,
            senderName: record.pushName,
            senderJid: record.key?.participant || record.key?.remoteJid,
            messageText: text,
            messageTimestamp: record.messageTimestamp ? record.messageTimestamp * 1000 : Date.now(),
            serviceMatch: classification.serviceMatch,
            needSummary: classification.needSummary,
            priority: VALID_PRIORITIES.has(classification.priority) ? classification.priority : 'baixa',
            relevanceReason: classification.reason
        });

        if (lead) {
            events.emit('notification', {
                kind: 'radar_lead',
                priority: lead.priority,
                leadName: lead.sender_name,
                groupName: lead.group_name,
                summary: lead.need_summary || lead.service_match
            });
        }

        if (lead && (lead.priority === 'alta' || lead.priority === 'media')) {
            await this.sendAlerts(lead);
            await leadRadarStore.markAlerted(lead.id);
        }
        return lead;
    }

    /**
     * Caminho em tempo real: uma mensagem de grupo recebida agora (webhook).
     */
    async processIncomingGroupMessage({ groupId, groupName, senderName, senderJid, message, messageId, fromMe }) {
        console.log(`📡 Radar (tempo real) recebeu mensagem de "${groupName}" (${groupId}): "${(message || '').slice(0, 80)}"`);
        if (fromMe || !message) return null;
        if (await this.groupsStore.isExcluded(groupId)) { console.log('   → grupo excluído da varredura'); return null; }
        if (!this.matchesPrefilter(message)) { console.log('   → não passou no prefiltro (sem palavra-chave de serviço)'); return null; }
        console.log('   → passou no prefiltro, classificando com IA...');

        const [classification] = await this.classifyBatch([{ text: message }]);
        console.log('   → classificação:', JSON.stringify(classification));
        return this.persistIfLead({
            groupId,
            groupName,
            record: {
                key: { id: messageId, participant: senderJid, remoteJid: groupId },
                pushName: senderName,
                messageTimestamp: Math.floor(Date.now() / 1000) // evento em tempo real: "agora" é uma aproximação correta
            },
            text: message,
            classification
        });
    }

    /**
     * Caminho de varredura (backfill de até 7 dias e/ou poller): passa por
     * todos os grupos não excluídos, respeitando o cursor de cada um.
     */
    async scanGroups({ sinceDays = 7, maxPagesPerGroup = 3 } = {}) {
        const cutoff = Date.now() - Math.min(sinceDays, 7) * 24 * 60 * 60 * 1000;
        const groups = await this.whatsapp.getGroups();
        const summary = { groupsScanned: 0, groupsSkipped: 0, candidates: 0, leadsFound: 0 };

        for (const group of groups) {
            const groupId = group.id;
            if (!groupId || await this.groupsStore.isExcluded(groupId)) {
                summary.groupsSkipped += 1;
                continue;
            }

            const cursor = await leadRadarStore.getCursor(groupId);
            const cursorMs = cursor?.last_message_timestamp ? new Date(cursor.last_message_timestamp).getTime() : 0;
            const effectiveCutoff = Math.max(cutoff, cursorMs);

            let allRecords = [];
            for (let page = 1; page <= maxPagesPerGroup; page += 1) {
                const { records, pages } = await this.whatsapp.findMessages(groupId, { page });
                if (!records.length) break;
                allRecords = allRecords.concat(records);
                if (page >= pages) break;
            }

            const candidates = [];
            let newestTimestamp = cursorMs;
            for (const record of allRecords) {
                const ts = (record.messageTimestamp || 0) * 1000;
                if (ts > newestTimestamp) newestTimestamp = ts;
                if (ts <= effectiveCutoff || record.key?.fromMe) continue;
                const text = extractText(record);
                if (text && this.matchesPrefilter(text)) candidates.push({ record, text });
            }

            summary.candidates += candidates.length;
            summary.groupsScanned += 1;

            for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
                const batch = candidates.slice(i, i + BATCH_SIZE);
                const classifications = await this.classifyBatch(batch.map(b => ({ text: b.text })));
                for (let j = 0; j < batch.length; j += 1) {
                    const lead = await this.persistIfLead({
                        groupId,
                        groupName: group.subject,
                        record: batch[j].record,
                        text: batch[j].text,
                        classification: classifications[j]
                    });
                    if (lead) summary.leadsFound += 1;
                }
            }

            await leadRadarStore.saveCursor(groupId, group.subject, newestTimestamp || Date.now());
        }

        console.log(`📡 Radar de leads: ${summary.groupsScanned} grupos varridos, ${summary.candidates} candidatos pré-filtrados, ${summary.leadsFound} leads novos`);
        return summary;
    }

    /**
     * Liga o poller no boot do servidor, respeitando LEAD_RADAR_POLL_MINUTES
     * (intervalo) e a preferência salva no painel (radar.autoScanEnabled,
     * default ligado) — o operador pode pausar/retomar em tempo de execução
     * sem reiniciar o servidor via setAutoScanEnabled().
     */
    async startPoller() {
        if (process.env.VERCEL) {
            console.log('ℹ️  Radar de leads: rodando em função serverless, use a rota de cron (/api/cron/scan) em vez do setInterval local.');
            return;
        }

        this._pollMinutes = Number(process.env.LEAD_RADAR_POLL_MINUTES || 0);
        if (!this._pollMinutes || this._pollMinutes <= 0) {
            console.log('ℹ️  Radar de leads: LEAD_RADAR_POLL_MINUTES não configurado, varredura automática desativada.');
            return;
        }

        const saved = (await new SettingsStore().get()).radar || {};
        const enabled = saved.autoScanEnabled !== false; // default ligado
        if (enabled) this._startInterval();
        else console.log('⏸️  Radar de leads: varredura automática desativada pelo operador.');
    }

    _startInterval() {
        if (this._intervalHandle || !this._pollMinutes) return;
        console.log(`📡 Radar de leads: varredura automática a cada ${this._pollMinutes} min`);
        this._intervalHandle = setInterval(() => {
            this.scanGroups().catch(error => console.error('Erro na varredura automática do radar:', error.message));
        }, this._pollMinutes * 60 * 1000);
    }

    _stopInterval() {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = null;
        }
    }

    isAutoScanRunning() {
        return Boolean(this._intervalHandle);
    }

    /**
     * Liga/desliga o scan automático em tempo real, sem reiniciar o
     * servidor. A preferência fica salva (data/dashboard-settings.json) e
     * sobrevive a um restart.
     */
    async setAutoScanEnabled(enabled) {
        await new SettingsStore().update({ radar: { autoScanEnabled: Boolean(enabled) } });
        if (enabled) this._startInterval();
        else this._stopInterval();
        return this.isAutoScanRunning();
    }
}

module.exports = new LeadRadar();
