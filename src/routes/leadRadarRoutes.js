const express = require('express');
const leadRadar = require('../leadRadar');
const leadRadarStore = require('../leadRadarStore');
const LeadAgent = require('../leadAgent');
const { SettingsStore } = require('../settingsStore');

const router = express.Router();
const agent = new LeadAgent();

function parseNicheFromLead(lead, nicheById) {
    const serviceMatch = String(lead.service_match || '');
    const match = serviceMatch.match(/^\[niche:([^|\]]+)\|([^\]]+)\]\s*(.*)$/);
    if (!match) return { ...lead, niche_id: 'default', niche_name: 'Perfil principal' };
    const niche = nicheById.get(match[1]);
    return {
        ...lead,
        service_match: match[3] || lead.service_match,
        niche_id: match[1],
        niche_name: niche?.name || match[2]
    };
}

const checkSupabase = (req, res, next) => {
    if (!leadRadarStore.isConfigured()) {
        return res.status(500).json({ error: 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.' });
    }
    next();
};

const checkConfig = (req, res, next) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    next();
};

router.get('/groups', async (req, res) => {
    try {
        const groups = await leadRadar.whatsapp.getGroups();
        const excludedIds = new Set(await leadRadar.groupsStore.listExcluded());
        res.json({
            success: true,
            groups: groups.map(g => ({
                id: g.id,
                name: g.subject,
                size: g.size,
                excluded: excludedIds.has(g.id)
            }))
        });
    } catch (error) {
        console.error('Error listing groups for lead radar:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/groups/:groupId/exclude', async (req, res) => {
    try {
        await leadRadar.groupsStore.exclude(req.params.groupId);
        res.json({ success: true, excludedGroupIds: await leadRadar.groupsStore.listExcluded() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/groups/:groupId/exclude', async (req, res) => {
    try {
        await leadRadar.groupsStore.include(req.params.groupId);
        res.json({ success: true, excludedGroupIds: await leadRadar.groupsStore.listExcluded() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/scan', checkSupabase, async (req, res) => {
    try {
        const sinceDays = Math.min(Number(req.body?.sinceDays) || 7, 7);
        const summary = await leadRadar.scanGroups({ sinceDays });
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error scanning groups for leads:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/auto-scan', async (req, res) => {
    try {
        const running = await leadRadar.setAutoScanEnabled(Boolean(req.body?.enabled));
        res.json({ success: true, running, pollMinutes: leadRadar._pollMinutes || 0 });
    } catch (error) {
        console.error('Error toggling radar auto-scan:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// A Vercel chama cron jobs via GET, com o header Authorization: Bearer
// <CRON_SECRET> automaticamente quando CRON_SECRET está configurado nas
// variáveis de ambiente do projeto. GET também permite testar com curl
// direto; aceito POST também, para chamar manualmente sem se importar com o método.
router.all('/cron/scan', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    const auth = req.get('authorization') || '';
    if (secret && auth !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    try {
        const summary = await leadRadar.scanGroups({ sinceDays: 7 });
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error running cron scan:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/leads', checkSupabase, async (req, res) => {
    try {
        const { since, priority, groupId, status, nicheId } = req.query;
        const leads = await leadRadarStore.listLeads({
            sinceDays: since ? Number(since) : 7,
            priority: priority || undefined,
            groupId: groupId || undefined,
            status: status || undefined
        });
        const settings = await new SettingsStore().get();
        const nicheById = new Map((settings.radar?.niches || []).map(niche => [niche.id, niche]));
        const enriched = leads.map(lead => parseNicheFromLead(lead, nicheById));
        const filtered = nicheId ? enriched.filter(lead => lead.niche_id === nicheId) : enriched;
        const counts = { alta: 0, media: 0, baixa: 0 };
        filtered.forEach(l => { if (counts[l.priority] !== undefined) counts[l.priority] += 1; });
        res.json({ success: true, total: filtered.length, counts, leads: filtered });
    } catch (error) {
        console.error('Error listing radar leads:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/leads/:id/contact', checkSupabase, checkConfig, async (req, res) => {
    try {
        const radarLead = await leadRadarStore.getLead(req.params.id);
        if (!radarLead) return res.status(404).json({ error: 'Lead do radar não encontrado' });
        const settings = await new SettingsStore().get();
        const nicheById = new Map((settings.radar?.niches || []).map(niche => [niche.id, niche]));
        const enrichedLead = parseNicheFromLead(radarLead, nicheById);

        const { testTarget } = req.body || {};
        const conversation = await agent.startRadarOutreach(enrichedLead, { testTarget });
        await leadRadarStore.updateStatus(radarLead.id, 'contatado');

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error contacting radar lead:', error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post('/leads/:id/status', checkSupabase, async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!['novo', 'contatado', 'dispensado'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }
        const lead = await leadRadarStore.updateStatus(req.params.id, status);
        res.json({ success: true, lead });
    } catch (error) {
        console.error('Error updating radar lead status:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
