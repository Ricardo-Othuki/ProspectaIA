/**
 * Settings Store - configurações não secretas do painel, persistidas no
 * Supabase (tabela app_settings, uma linha) quando configurado. Em uso
 * local sem Supabase, mantém fallback em arquivo para não quebrar o fluxo
 * de desenvolvimento; em serverless, Supabase é obrigatório.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'app_settings';
const ROW_ID = 'default';

const DEFAULTS = {
    campaign: { industry: '', style: 'balanced', language: 'portuguese', outputFormat: 'csv', resultLimit: 20, minLeadScore: 60 },
    generation: { model: '', maxContentGeneration: 50, multiTouch: false },
    dashboard: { refreshSeconds: 6 },
    alerts: { whatsappGroupId: '', whatsappGroupLabel: '', telegramChatId: '', ownerWhatsappNumber: '' },
    radar: { autoScanEnabled: true, activeNicheId: '', niches: [] }
};

const ALLOWED_STYLES = new Set(['balanced', 'professional', 'casual', 'aggressive']);
const ALLOWED_LANGUAGES = new Set(['portuguese', 'english', 'indonesian']);
const ALLOWED_FORMATS = new Set(['csv', 'json', 'vcard']);

let client = null;

function getClient() {
    if (client) return client;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
    }

    client = createClient(url, key, { auth: { persistSession: false } });
    return client;
}

function hasSupabaseConfig() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function shouldUseLocalFallback() {
    return !process.env.VERCEL && !hasSupabaseConfig();
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function merge(base, update) {
    const result = clone(base);
    for (const [key, value] of Object.entries(update || {})) {
        if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object') {
            result[key] = merge(result[key], value);
        } else if (Object.prototype.hasOwnProperty.call(result, key)) {
            result[key] = value;
        }
    }
    return result;
}

function cleanText(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function cleanList(value, limit = 30, itemMax = 120) {
    const items = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
    return Array.from(new Set(items.map(item => cleanText(item, itemMax)).filter(Boolean))).slice(0, limit);
}

function slugify(value) {
    const slug = cleanText(value, 80)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || `nicho-${Date.now()}`;
}

function normalizeRadarNiche(niche = {}) {
    const name = cleanText(niche.name, 80);
    const id = cleanText(niche.id, 80) || slugify(name);
    return {
        id,
        name,
        description: cleanText(niche.description, 600),
        offer: cleanText(niche.offer, 600),
        keywords: cleanList(niche.keywords, 60),
        negativeKeywords: cleanList(niche.negativeKeywords, 60),
        qualificationSignals: cleanList(niche.qualificationSignals, 30, 180),
        complianceRules: cleanList(niche.complianceRules, 20, 220),
        initialMessageTemplate: cleanText(niche.initialMessageTemplate, 1000),
        active: Boolean(niche.active)
    };
}

function normalizeRadarSettings(radar = {}) {
    const niches = Array.isArray(radar.niches)
        ? radar.niches.map(normalizeRadarNiche).filter(niche => niche.id && niche.name).slice(0, 20)
        : [];
    const activeFromFlag = niches.find(niche => niche.active)?.id || '';
    const activeNicheId = cleanText(radar.activeNicheId || activeFromFlag, 80);
    return {
        ...radar,
        autoScanEnabled: typeof radar.autoScanEnabled === 'boolean' ? radar.autoScanEnabled : true,
        activeNicheId: niches.some(niche => niche.id === activeNicheId) ? activeNicheId : activeFromFlag,
        niches: niches.map(niche => ({ ...niche, active: niche.id === (activeNicheId || activeFromFlag) }))
    };
}

function validate(next) {
    const errors = {};
    if (!ALLOWED_STYLES.has(next.campaign.style)) errors['campaign.style'] = 'Estilo de campanha inválido';
    if (!ALLOWED_LANGUAGES.has(next.campaign.language)) errors['campaign.language'] = 'Idioma inválido';
    if (!ALLOWED_FORMATS.has(next.campaign.outputFormat)) errors['campaign.outputFormat'] = 'Formato de saída inválido';
    for (const [key, min, max] of [['resultLimit', 1, 1000], ['minLeadScore', 0, 100], ['maxContentGeneration', 1, 1000], ['refreshSeconds', 3, 3600]]) {
        const value = key === 'maxContentGeneration' ? next.generation[key] : key === 'refreshSeconds' ? next.dashboard[key] : next.campaign[key];
        if (!Number.isInteger(value) || value < min || value > max) errors[key] = `Valor deve ser um inteiro entre ${min} e ${max}`;
    }
    if (typeof next.generation.model !== 'string' || next.generation.model.length > 120) errors['generation.model'] = 'Modelo inválido';
    if (typeof next.generation.multiTouch !== 'boolean') errors['generation.multiTouch'] = 'Valor inválido';
    if (typeof next.campaign.industry !== 'string' || next.campaign.industry.length > 120) errors['campaign.industry'] = 'Setor inválido';
    for (const key of ['whatsappGroupId', 'whatsappGroupLabel', 'telegramChatId', 'ownerWhatsappNumber']) {
        if (typeof next.alerts[key] !== 'string' || next.alerts[key].length > 120) errors[`alerts.${key}`] = 'Valor inválido';
    }
    next.radar = normalizeRadarSettings(next.radar);
    if (typeof next.radar.autoScanEnabled !== 'boolean') errors['radar.autoScanEnabled'] = 'Valor inválido';
    if (!Array.isArray(next.radar.niches)) errors['radar.niches'] = 'Nichos inválidos';
    next.radar.niches.forEach((niche, index) => {
        if (!niche.name) errors[`radar.niches.${index}.name`] = 'Nome do nicho é obrigatório';
        if (!niche.keywords.length) errors[`radar.niches.${index}.keywords`] = 'Informe ao menos uma palavra-chave';
    });
    return errors;
}

class SettingsStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'dashboard-settings.json')) {
        this.filePath = filePath;
        this.settings = null;
    }

    _loadLocal() {
        try {
            if (fs.existsSync(this.filePath)) return merge(DEFAULTS, JSON.parse(fs.readFileSync(this.filePath, 'utf8')));
        } catch (error) {
            console.error('Falha ao carregar configurações locais do painel:', error.message);
        }
        return clone(DEFAULTS);
    }

    _persistLocal(settings) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    async get() {
        if (shouldUseLocalFallback()) {
            if (!this.settings) this.settings = this._loadLocal();
            return clone(this.settings);
        }

        const { data, error } = await getClient()
            .from(TABLE)
            .select('data')
            .eq('id', ROW_ID)
            .maybeSingle();

        if (error) throw new Error(`Falha ao ler configurações no Supabase: ${error.message}`);
        return merge(DEFAULTS, data ? data.data : {});
    }

    async update(input) {
        const current = await this.get();
        const next = merge(current, input);
        const errors = validate(next);
        if (Object.keys(errors).length) {
            const error = new Error('Configurações inválidas');
            error.fields = errors;
            throw error;
        }

        if (shouldUseLocalFallback()) {
            this.settings = next;
            this._persistLocal(next);
            return this.get();
        }

        const { error } = await getClient()
            .from(TABLE)
            .upsert({ id: ROW_ID, data: next, updated_at: new Date().toISOString() });

        if (error) throw new Error(`Falha ao salvar configurações no Supabase: ${error.message}`);
        return next;
    }
}

module.exports = { SettingsStore, DEFAULTS, normalizeRadarNiche, normalizeRadarSettings };
