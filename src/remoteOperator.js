/**
 * Remote Operator - interpreta respostas a notificações e comandos de texto
 * vindos dos canais autorizados (WhatsApp/Telegram), para aprovar/descartar
 * rascunhos e consultar o sistema sem abrir o painel. Compartilhado entre
 * telegramPoller.js (funciona hoje) e agentRoutes.js /inbound (WhatsApp,
 * ativa após o deploy) para nunca ter duas implementações divergentes.
 */

const LeadAgent = require('./leadAgent');
const leadRadar = require('./leadRadar');
const leadRadarStore = require('./leadRadarStore');

const agent = new LeadAgent();

const CONFIRM_WORDS = new Set(['sim', 'aprovar', 'aprova', 'ok', 'okay', 'pode', 'manda', 'envia', 'pode enviar', 'confirmo', 'confirmado']);
const CANCEL_WORDS = new Set(['não', 'nao', 'cancelar', 'descartar', 'não enviar', 'nao enviar', 'cancela']);

function classifyReply(text) {
    const normalized = text.trim().toLowerCase();
    if (!normalized || CONFIRM_WORDS.has(normalized)) return { action: 'approve' };
    if (CANCEL_WORDS.has(normalized)) return { action: 'discard' };
    return { action: 'edit', editedContent: text.trim() };
}

async function handleDraftReply(leadId, text) {
    const { action, editedContent } = classifyReply(text);

    if (action === 'discard') {
        await agent.discardPendingMessage(leadId);
        return '❌ Rascunho descartado, nada foi enviado.';
    }

    const result = await agent.approvePendingMessage(leadId, editedContent ? { editedContent } : {});
    return `✅ Mensagem enviada${editedContent ? ' (com o texto que você mandou)' : ''} para ${result.conversation.leadName}.`;
}

async function handleAuthorizationReply(kind, leadId, text) {
    if (kind === 'price') {
        await agent.applyPriceAuthorization(leadId, text);
        return '💰 Valor autorizado — gerei um novo rascunho com essa informação, aguardando sua aprovação.';
    }
    await agent.applyCloseConfirmation(leadId, text);
    return '🤝 Confirmação registrada.';
}

/**
 * Aplica a decisão do operador para uma resposta correlacionada
 * ({leadId, kind: 'draft'|'price'|'close'}) e devolve o texto de confirmação
 * a enviar de volta no mesmo canal.
 */
async function handleReply(correlation, text) {
    if (!text || !text.trim()) return null;
    if (correlation.kind === 'draft') return handleDraftReply(correlation.leadId, text);
    return handleAuthorizationReply(correlation.kind, correlation.leadId, text);
}

async function handleCommand(rawText) {
    const [cmdRaw, ...rest] = rawText.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const arg = rest.join(' ').trim();

    if (cmd === '/pendentes') {
        const conversations = await agent.listConversations();
        const pending = conversations.filter(c => c.pendingMessage);
        if (!pending.length) return 'Nenhum rascunho pendente agora.';
        return pending
            .map(c => `• ${c.leadId} — ${c.leadName}: "${(c.pendingMessage.content || '').slice(0, 80)}${c.pendingMessage.content.length > 80 ? '...' : ''}"`)
            .join('\n');
    }

    if (cmd === '/rascunho') {
        if (!arg) return 'Uso: /rascunho <leadId> (veja o leadId com /pendentes)';
        const conversation = await agent.getConversation(arg);
        if (!conversation || !conversation.pendingMessage) return 'Sem rascunho pendente para esse lead.';
        return `Rascunho para ${conversation.leadName}:\n\n"${conversation.pendingMessage.content}"\n\nResponda esta mensagem para aprovar/editar/descartar.`;
    }

    if (cmd === '/scan') {
        const summary = await leadRadar.scanGroups({ sinceDays: 7 });
        return `📡 Varredura concluída: ${summary.groupsScanned} grupos, ${summary.candidates} candidatos, ${summary.leadsFound} leads novos.`;
    }

    if (cmd === '/status') {
        const status = await agent.getConversationsStatus();
        const leads = await leadRadarStore.listLeads({ sinceDays: 7 });
        const counts = { alta: 0, media: 0, baixa: 0 };
        leads.forEach(l => { if (counts[l.priority] !== undefined) counts[l.priority] += 1; });
        return `📋 Conversas aguardando aprovação: ${status.awaitingApproval}\n📡 Leads do radar (7 dias): ${leads.length} (alta ${counts.alta} · média ${counts.media} · baixa ${counts.baixa})`;
    }

    return null;
}

module.exports = { classifyReply, handleReply, handleCommand };
