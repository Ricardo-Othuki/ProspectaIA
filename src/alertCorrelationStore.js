/**
 * Alert Correlation Store - associa a mensagem de um alerta enviado
 * (WhatsApp e/ou Telegram) ao lead e ao tipo de pedido (rascunho, preço,
 * fechamento), para que uma resposta (reply) a essa mensagem seja aplicada
 * ao lead certo. Persistido no Supabase (tabela alert_correlations) quando
 * configurado; local sem Supabase usa arquivo, e serverless exige Supabase.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'alert_correlations';

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

class AlertCorrelationStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'alert-correlations.json')) {
        this.filePath = filePath;
        this.entries = null;
    }

    _ensureLocalLoaded() {
        if (this.entries) return;
        try {
            this.entries = fs.existsSync(this.filePath)
                ? JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
                : {};
        } catch (error) {
            console.error('Falha ao carregar correlações locais de alerta:', error.message);
            this.entries = {};
        }
    }

    _persistLocal() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify(this.entries, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    key(channel, messageId) {
        return `${channel}:${messageId}`;
    }

    async save(channel, messageId, { leadId, kind }) {
        if (!messageId) return;

        if (shouldUseLocalFallback()) {
            this._ensureLocalLoaded();
            this.entries[this.key(channel, messageId)] = { leadId, kind, createdAt: new Date().toISOString() };
            this._persistLocal();
            return;
        }

        const { error } = await getClient()
            .from(TABLE)
            .upsert({ channel, message_id: String(messageId), lead_id: leadId, kind });

        if (error) throw new Error(`Falha ao salvar correlação de alerta: ${error.message}`);
    }

    async get(channel, messageId) {
        if (!messageId) return null;

        if (shouldUseLocalFallback()) {
            this._ensureLocalLoaded();
            return this.entries[this.key(channel, messageId)] || null;
        }

        const { data, error } = await getClient()
            .from(TABLE)
            .select('lead_id, kind')
            .eq('channel', channel)
            .eq('message_id', String(messageId))
            .maybeSingle();

        if (error) throw new Error(`Falha ao ler correlação de alerta: ${error.message}`);
        return data ? { leadId: data.lead_id, kind: data.kind } : null;
    }
}

module.exports = { AlertCorrelationStore };
