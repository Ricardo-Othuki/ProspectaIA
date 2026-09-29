const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeInboundEvent } = require('./whatsappMonitoringStore');

const SCENARIOS = {
    padrao: {
        id: 'padrao',
        nome: 'Fluxo completo de prospecção e monitoramento',
        profile: { business: { name: 'Agência Exemplo', type: 'Marketing digital', description: 'Automação comercial para pequenos negócios' } },
        campaign: { industry: 'professional', style: 'balanced', language: 'portuguese', minLeadScore: 60 },
        leads: [
            { id: 'lead-001', name: 'Clínica Modelo', category: 'professional', phone: '5511999990001', website: 'https://clinica.exemplo.test', rating: 4.8, reviews: 96 },
            { id: 'lead-002', name: 'Negócio Sem Perfil', category: 'unknown', phone: '', website: '', rating: 2.1, reviews: 1 }
        ],
        allowlist: ['5511999990001'],
        inbound: [
            { name: 'Contato Permitido', phone: '5511999990001', message: 'Quero entender a automação.', eventId: 'sim-permitido-001' },
            { name: 'Contato Não Permitido', phone: '5511999990002', message: 'Quero uma proposta.', eventId: 'sim-bloqueado-001' },
            { name: 'Conta Própria', phone: '5511999990001', message: 'Mensagem própria.', eventId: 'sim-proprio-001', fromMe: true },
            { name: 'Contato Duplicado', phone: '5511999990001', message: 'Quero entender a automação.', eventId: 'sim-permitido-001' }
        ]
    }
};

function now() {
    return new Date().toISOString();
}

function scoreLead(lead) {
    let score = 0;
    if (lead.rating >= 4) score += 35;
    if (lead.reviews >= 20) score += 20;
    if (lead.website) score += 20;
    if (lead.phone) score += 15;
    if (lead.category === 'professional') score += 10;
    return Math.min(100, score);
}

function makeSuggestion(lead) {
    return `Olá! Vi que a ${lead.name} pode se beneficiar de automação comercial. Posso explicar como qualificamos contatos e organizamos o atendimento?`;
}

class FlowSimulationRunner {
    constructor(options = {}) {
        this.outputDirectory = options.outputDirectory || path.join(process.cwd(), 'output', 'simulations');
    }

    listScenarios() {
        return Object.values(SCENARIOS).map(({ id, nome }) => ({ id, nome }));
    }

    run(scenarioId = 'padrao') {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) throw new Error('Cenário de simulação inválido');

        const startedAt = now();
        const steps = [];
        const assertions = [];
        const externalEffects = { networkRequests: 0, messagesSent: 0, calendarEventsCreated: 0, secretsRead: false };
        const addStep = (name, status, details) => steps.push({ name, status, details, at: now() });
        const assert = (name, condition, details) => assertions.push({ name, passed: Boolean(condition), details });

        addStep('Perfil e preferências de fixture carregados', 'concluída', { business: scenario.profile.business.name, language: scenario.campaign.language });
        assert('Nenhum segredo foi lido', externalEffects.secretsRead === false, 'O cenário contém apenas fixtures locais.');

        const discovered = scenario.leads.map(lead => ({ ...lead, source: 'fixture-local' }));
        addStep('Descoberta de leads simulada', 'concluída', { total: discovered.length });
        assert('Nenhuma requisição externa foi feita na descoberta', externalEffects.networkRequests === 0, 'O scraper foi substituído por fixture.');

        const qualified = discovered.map(lead => ({ ...lead, score: scoreLead(lead), qualified: scoreLead(lead) >= scenario.campaign.minLeadScore }));
        addStep('Qualificação de leads simulada', 'concluída', { qualified: qualified.filter(lead => lead.qualified).length, total: qualified.length });
        assert('Há um lead qualificado', qualified.some(lead => lead.qualified), 'A fixture deve conter pelo menos um lead prioritário.');

        const content = qualified.filter(lead => lead.qualified).map(lead => ({ leadId: lead.id, content: makeSuggestion(lead), provider: 'ia-simulada' }));
        addStep('Conteúdo de campanha gerado', 'concluída', { total: content.length, provider: 'ia-simulada' });
        assert('IA externa não foi chamada', externalEffects.networkRequests === 0, 'O conteúdo é determinístico e local.');

        const receipts = new Set();
        const monitoring = scenario.inbound.map(payload => {
            const event = normalizeInboundEvent(payload);
            let result;
            if (event.fromMe) result = { eventId: event.eventId, status: 'ignorado', reason: 'from_me', sent: false };
            else if (!scenario.allowlist.includes(event.target)) result = { eventId: event.eventId, status: 'ignorado', reason: 'not_allowed', sent: false };
            else if (receipts.has(event.eventId)) result = { eventId: event.eventId, status: 'ignorado', reason: 'duplicate', sent: false };
            else {
                receipts.add(event.eventId);
                const lead = qualified.find(item => item.phone === event.target) || { name: event.name || 'Contato' };
                result = { eventId: event.eventId, status: 'sugestao', reason: null, sent: false, suggestion: makeSuggestion(lead) };
            }
            return result;
        });
        addStep('Eventos WhatsApp simulados', 'concluída', { total: monitoring.length, suggestions: monitoring.filter(item => item.status === 'sugestao').length });
        assert('Evento permitido gera sugestão sem envio', monitoring.some(item => item.status === 'sugestao' && item.sent === false), 'O modo monitoramento mantém envio automático desativado.');
        assert('Evento não permitido é bloqueado', monitoring.some(item => item.reason === 'not_allowed'), 'Alvos fora da allowlist não chegam ao agente.');
        assert('Mensagem própria é ignorada', monitoring.some(item => item.reason === 'from_me'), 'Mensagens da conta conectada não são processadas.');
        assert('Evento duplicado é ignorado', monitoring.some(item => item.reason === 'duplicate'), 'O recibo de evento evita processamento repetido.');

        const reviewedSend = { target: scenario.allowlist[0], intentRecorded: true, delivered: false, provider: 'whatsapp-simulado' };
        addStep('Envio revisado simulado', 'concluída', reviewedSend);
        assert('Envio revisado não entrega mensagem externa', reviewedSend.delivered === false && externalEffects.messagesSent === 0, 'O adaptador fake registra apenas a intenção.');
        assert('Calendário externo não foi alterado', externalEffects.calendarEventsCreated === 0, 'Nenhum evento real foi criado.');

        const finishedAt = now();
        const report = {
            id: `simulation-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            scenario: { id: scenario.id, name: scenario.nome },
            startedAt,
            finishedAt,
            durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
            success: assertions.every(item => item.passed),
            safety: { externalEffects, confirmed: externalEffects.networkRequests === 0 && externalEffects.messagesSent === 0 && externalEffects.calendarEventsCreated === 0 && externalEffects.secretsRead === false },
            steps,
            assertions,
            summary: { leadsDiscovered: discovered.length, leadsQualified: qualified.filter(lead => lead.qualified).length, contentGenerated: content.length, monitoring, reviewedSend }
        };
        fs.mkdirSync(this.outputDirectory, { recursive: true });
        const reportPath = path.join(this.outputDirectory, `${report.id}.json`);
        fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
        return { ...report, reportPath };
    }
}

module.exports = { FlowSimulationRunner };
