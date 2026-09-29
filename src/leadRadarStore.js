/**
 * Lead Radar Store - Persistência dos leads detectados em grupos e dos
 * cursores de varredura por grupo, no Supabase (mesmo projeto usado por
 * conversationStore.js). Chave de serviço só é lida aqui, no backend.
 */

const { createClient } = require('@supabase/supabase-js');

const LEADS_TABLE = 'group_radar_leads';
const CURSORS_TABLE = 'group_radar_cursors';

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

function isConfigured() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Insere um lead novo. Se `message_id` já existir, ignora silenciosamente
 * (dedupe) e retorna null — nunca duplica lead nem dispara alerta de novo.
 */
async function insertLeadIfNew(lead) {
    const { data, error } = await getClient()
        .from(LEADS_TABLE)
        .insert({
            message_id: lead.messageId,
            group_id: lead.groupId,
            group_name: lead.groupName || null,
            sender_name: lead.senderName || null,
            sender_jid: lead.senderJid || null,
            message_text: lead.messageText || null,
            message_timestamp: lead.messageTimestamp ? new Date(lead.messageTimestamp).toISOString() : null,
            service_match: lead.serviceMatch || null,
            need_summary: lead.needSummary || null,
            priority: lead.priority,
            relevance_reason: lead.relevanceReason || null
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return null; // unique_violation: já existia
        throw new Error(`Falha ao gravar lead no Supabase: ${error.message}`);
    }
    return data;
}

async function markAlerted(id) {
    const { error } = await getClient().from(LEADS_TABLE).update({ alerted: true }).eq('id', id);
    if (error) throw new Error(`Falha ao marcar alerta enviado: ${error.message}`);
}

async function updateStatus(id, status) {
    const { data, error } = await getClient().from(LEADS_TABLE).update({ status }).eq('id', id).select().single();
    if (error) throw new Error(`Falha ao atualizar status do lead: ${error.message}`);
    return data;
}

async function listLeads({ sinceDays = 7, priority, groupId, status } = {}) {
    const cutoff = new Date(Date.now() - Math.min(sinceDays, 7) * 24 * 60 * 60 * 1000).toISOString();
    let query = getClient()
        .from(LEADS_TABLE)
        .select('*')
        .gte('detected_at', cutoff)
        .order('detected_at', { ascending: false });

    if (priority) query = query.eq('priority', priority);
    if (groupId) query = query.eq('group_id', groupId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao listar leads no Supabase: ${error.message}`);
    return data || [];
}

async function getLead(id) {
    const { data, error } = await getClient()
        .from(LEADS_TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw new Error(`Falha ao buscar lead no Supabase: ${error.message}`);
    return data;
}

async function getLatestLeadBySenderJid(senderJid) {
    if (!senderJid) return null;
    const { data, error } = await getClient()
        .from(LEADS_TABLE)
        .select('*')
        .eq('sender_jid', senderJid)
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(`Falha ao buscar lead por sender_jid no Supabase: ${error.message}`);
    return data;
}

async function getCursor(groupId) {
    const { data, error } = await getClient()
        .from(CURSORS_TABLE)
        .select('*')
        .eq('group_id', groupId)
        .maybeSingle();

    if (error) throw new Error(`Falha ao ler cursor do grupo: ${error.message}`);
    return data;
}

async function saveCursor(groupId, groupName, lastMessageTimestamp) {
    const { error } = await getClient()
        .from(CURSORS_TABLE)
        .upsert({
            group_id: groupId,
            group_name: groupName || null,
            last_message_timestamp: lastMessageTimestamp ? new Date(lastMessageTimestamp).toISOString() : null,
            last_scanned_at: new Date().toISOString()
        }, { onConflict: 'group_id' });

    if (error) throw new Error(`Falha ao salvar cursor do grupo: ${error.message}`);
}

module.exports = {
    isConfigured,
    insertLeadIfNew,
    markAlerted,
    updateStatus,
    listLeads,
    getLead,
    getLatestLeadBySenderJid,
    getCursor,
    saveCursor
};
