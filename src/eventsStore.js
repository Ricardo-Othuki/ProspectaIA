/**
 * Events Store - log de eventos do painel (rascunho pronto, lead do radar
 * detectado, progresso de campanha) persistido no Supabase quando
 * configurado, para o painel consultar por polling em vez de depender de
 * uma conexão SSE mantida
 * aberta (que não funciona entre invocações serverless independentes).
 */

const { createClient } = require('@supabase/supabase-js');

const TABLE = 'dashboard_events';
const localEvents = [];

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

async function logEvent(type, payload) {
    if (shouldUseLocalFallback()) {
        localEvents.push({
            id: `${Date.now()}-${localEvents.length}`,
            type,
            payload: payload || {},
            created_at: new Date().toISOString()
        });
        if (localEvents.length > 500) localEvents.shift();
        return;
    }

    try {
        const { error } = await getClient().from(TABLE).insert({ type, payload: payload || {} });
        if (error) console.error('Falha ao gravar evento do painel:', error.message);
    } catch (error) {
        console.error('Falha ao gravar evento do painel:', error.message);
    }
}

async function listSince(sinceIso) {
    if (shouldUseLocalFallback()) {
        if (!sinceIso) return localEvents.slice(-100);
        return localEvents.filter(event => event.created_at > sinceIso).slice(-100);
    }

    const query = getClient()
        .from(TABLE)
        .select('id, type, payload, created_at')
        .order('created_at', { ascending: true })
        .limit(100);

    const { data, error } = sinceIso ? await query.gt('created_at', sinceIso) : await query;
    if (error) throw new Error(`Falha ao ler eventos do painel: ${error.message}`);
    return data || [];
}

module.exports = { logEvent, listSince };
