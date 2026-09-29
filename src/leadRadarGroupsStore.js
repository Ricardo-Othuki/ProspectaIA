/**
 * Lead Radar Groups Store - quais grupos ficam de fora da varredura do
 * radar (configuração operacional, não dado de negócio). Persistido no
 * Supabase (tabela radar_excluded_groups) quando configurado. Em uso local
 * sem Supabase, mantém fallback em arquivo; em serverless, Supabase é
 * obrigatório. Mantém um cache em memória por instância —
 * carregado uma vez (uma invocação serverless, ou o processo local inteiro)
 * e mantido em sincronia por exclude()/include().
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'radar_excluded_groups';

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

class LeadRadarGroupsStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'lead-radar-groups.json')) {
        this.filePath = filePath;
        this._excluded = new Set();
        this._loaded = false;
    }

    async _ensureLoaded() {
        if (this._loaded) return;
        if (shouldUseLocalFallback()) {
            try {
                if (fs.existsSync(this.filePath)) {
                    const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                    this._excluded = new Set(Array.isArray(raw.excludedGroupIds) ? raw.excludedGroupIds : []);
                }
            } catch (error) {
                console.error('Falha ao carregar grupos excluídos locais do radar:', error.message);
            }
            this._loaded = true;
            return;
        }

        const { data, error } = await getClient().from(TABLE).select('group_id');
        if (error) throw new Error(`Falha ao carregar grupos excluídos do radar: ${error.message}`);
        this._excluded = new Set((data || []).map(row => row.group_id));
        this._loaded = true;
    }

    _persistLocal() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify({ excludedGroupIds: Array.from(this._excluded) }, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    async isExcluded(groupId) {
        await this._ensureLoaded();
        return this._excluded.has(groupId);
    }

    async exclude(groupId) {
        await this._ensureLoaded();
        if (shouldUseLocalFallback()) {
            this._excluded.add(groupId);
            this._persistLocal();
            return;
        }

        const { error } = await getClient().from(TABLE).upsert({ group_id: groupId });
        if (error) throw new Error(`Falha ao excluir grupo do radar: ${error.message}`);
        this._excluded.add(groupId);
    }

    async include(groupId) {
        await this._ensureLoaded();
        if (shouldUseLocalFallback()) {
            this._excluded.delete(groupId);
            this._persistLocal();
            return;
        }

        const { error } = await getClient().from(TABLE).delete().eq('group_id', groupId);
        if (error) throw new Error(`Falha ao reincluir grupo no radar: ${error.message}`);
        this._excluded.delete(groupId);
    }

    async listExcluded() {
        await this._ensureLoaded();
        return Array.from(this._excluded);
    }
}

module.exports = { LeadRadarGroupsStore };
