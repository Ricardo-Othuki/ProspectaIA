const fs = require('fs');
const path = require('path');

const DEFAULTS = {
    campaign: { industry: '', style: 'balanced', language: 'portuguese', outputFormat: 'csv', resultLimit: 20, minLeadScore: 60 },
    generation: { model: '', maxContentGeneration: 50, multiTouch: false },
    dashboard: { refreshSeconds: 6 },
    alerts: { whatsappGroupId: '', whatsappGroupLabel: '', telegramChatId: '', ownerWhatsappNumber: '' },
    radar: { autoScanEnabled: true }
};

const ALLOWED_STYLES = new Set(['balanced', 'professional', 'casual', 'aggressive']);
const ALLOWED_LANGUAGES = new Set(['portuguese', 'english', 'indonesian']);
const ALLOWED_FORMATS = new Set(['csv', 'json', 'vcard']);

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

class SettingsStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'dashboard-settings.json')) {
        this.filePath = filePath;
        this.settings = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) return merge(DEFAULTS, JSON.parse(fs.readFileSync(this.filePath, 'utf8')));
        } catch (error) {
            console.error('Falha ao carregar configurações do painel:', error.message);
        }
        return clone(DEFAULTS);
    }

    get() {
        return clone(this.settings);
    }

    validate(next) {
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
        if (typeof next.radar.autoScanEnabled !== 'boolean') errors['radar.autoScanEnabled'] = 'Valor inválido';
        return errors;
    }

    update(input) {
        const next = merge(this.settings, input);
        const errors = this.validate(next);
        if (Object.keys(errors).length) {
            const error = new Error('Configurações inválidas');
            error.fields = errors;
            throw error;
        }
        this.settings = next;
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify(this.settings, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
        return this.get();
    }
}

module.exports = { SettingsStore, DEFAULTS };
