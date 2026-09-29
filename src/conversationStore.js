/**
 * Conversation Store - Persistência das conversas do LeadAgent no Supabase.
 *
 * Guarda cada conversa inteira (histórico de mensagens + rascunho pendente)
 * como um único registro jsonb, para sobreviver a restarts do servidor.
 * A chave de serviço do Supabase só é lida aqui, no backend.
 */

const { createClient } = require('@supabase/supabase-js');

const TABLE = 'conversations';

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

async function getConversation(leadId) {
    const { data, error } = await getClient()
        .from(TABLE)
        .select('data')
        .eq('lead_id', leadId)
        .maybeSingle();

    if (error) throw new Error(`Falha ao ler conversa no Supabase: ${error.message}`);
    return data ? data.data : undefined;
}

async function listConversations() {
    const { data, error } = await getClient()
        .from(TABLE)
        .select('data')
        .order('updated_at', { ascending: false });

    if (error) throw new Error(`Falha ao listar conversas no Supabase: ${error.message}`);
    return (data || []).map(row => row.data);
}

async function saveConversation(conversation) {
    if (!conversation || !conversation.leadId) {
        throw new Error('Conversa inválida: leadId ausente');
    }

    const { error } = await getClient()
        .from(TABLE)
        .upsert({
            lead_id: conversation.leadId,
            lead_name: conversation.leadName || null,
            status: conversation.status || null,
            human_controlled: Boolean(conversation.humanControlled),
            data: conversation,
            updated_at: new Date().toISOString()
        }, { onConflict: 'lead_id' });

    if (error) throw new Error(`Falha ao salvar conversa no Supabase: ${error.message}`);
    return conversation;
}

module.exports = { isConfigured, getConversation, listConversations, saveConversation };
