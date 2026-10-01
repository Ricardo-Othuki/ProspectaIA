/**
 * WhatsApp Integration Module
 * 
 * Integração com WhatsApp via Evolution API
 * Suporta: Evolution API, Twilio, Meta Cloud API, e simulation mode
 */

require('dotenv').config();
const axios = require('axios');

class WhatsAppIntegration {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || 'evolution';
        
        // Evolution API Config
        this.evolutionUrl = process.env.EVOLUTION_API_URL;
        this.evolutionApiKey = process.env.EVOLUTION_API_KEY;
        this.evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'othuki';
        
        // Twilio config (fallback)
        this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
        
        // Meta Cloud API config (fallback)
        this.metaApiKey = process.env.WHATSAPP_API_KEY;
        this.metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        
        console.log(`📱 WhatsApp Provider: ${this.provider}`);
        if (this.provider === 'evolution') {
            console.log(`📦 Evolution instance configured: ${this.evolutionInstance}`);
        }
    }

    /**
     * Envia mensagem via WhatsApp
     */
    async sendMessage(to, message, options = {}) {
        console.log(`📱 Enviando WhatsApp para ${to}...`);

        switch (this.provider) {
            case 'evolution':
                return await this.sendViaEvolution(to, message, options);
            case 'twilio':
                return await this.sendViaTwilio(to, message);
            case 'meta':
                return await this.sendViaMetaCloud(to, message);
            case 'simulation':
            default:
                return await this.sendViaSimulation(to, message);
        }
    }

    /**
     * Envio via Evolution API
     */
    async sendViaEvolution(to, message, options = {}) {
        try {
            const isGroup = options.isGroup || false;
            const number = isGroup
                ? String(to || '').trim().toLowerCase()
                : String(to || '').replace(/\D/g, '');

            if (!number) throw new Error('Destinatário inválido');

            const payload = {
                number,
                text: message
            };

            // Se for grupo, usar endpoint específico
            const endpoint = isGroup 
                ? `/message/sendText/${this.evolutionInstance}`
                : `/message/sendText/${this.evolutionInstance}`;

            console.log(`🔗 Enviando via Evolution API: ${this.evolutionUrl}${endpoint}`);

            const response = await axios.post(
                `${this.evolutionUrl}${endpoint}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.evolutionApiKey
                    },
                    timeout: 30000
                }
            );

            console.log(`✅ Mensagem enviada via Evolution API`);
            console.log(`🆔 Message ID: ${response.data?.key?.id || 'N/A'}`);

            return {
                success: true,
                messageId: response.data?.key?.id || `evo_${Date.now()}`,
                provider: 'evolution',
                data: response.data
            };
        } catch (error) {
            console.error(`❌ Erro Evolution API: ${error.message}`);
            if (error.response) {
                console.error(`📋 Response: ${JSON.stringify(error.response.data)}`);
            }
            return {
                success: false,
                error: error.message,
                provider: 'evolution'
            };
        }
    }

    async getEvolutionStatus() {
        if (this.provider !== 'evolution') {
            return { configured: true, provider: this.provider, connected: null };
        }

        if (!this.evolutionUrl || !this.evolutionApiKey || !this.evolutionInstance) {
            return { configured: false, provider: 'evolution', connected: false };
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/instance/connectionState/${this.evolutionInstance}`,
                { headers: { apikey: this.evolutionApiKey }, timeout: 10000 }
            );
            const state = response.data?.instance?.state || response.data?.state || null;
            return { configured: true, provider: 'evolution', connected: state === 'open', state };
        } catch (error) {
            return { configured: true, provider: 'evolution', connected: false, error: 'Não foi possível consultar o status da Evolution API' };
        }
    }

    async registerEvolutionWebhook(webhookUrl) {
        if (this.provider !== 'evolution') throw new Error('Registro de webhook disponível apenas para Evolution API');
        if (!this.evolutionUrl || !this.evolutionApiKey || !this.evolutionInstance) {
            throw new Error('Evolution API não está configurada');
        }
        if (!/^https?:\/\//i.test(String(webhookUrl || ''))) {
            throw new Error('URL do webhook inválida');
        }

        try {
            await axios.post(
                `${this.evolutionUrl}/webhook/set/${this.evolutionInstance}`,
                {
                    webhook: {
                        enabled: true,
                        url: webhookUrl,
                        webhook_by_events: false,
                        events: ['MESSAGES_UPSERT']
                    }
                },
                { headers: { 'Content-Type': 'application/json', apikey: this.evolutionApiKey }, timeout: 30000 }
            );
        } catch (error) {
            const requiresWebhookObject = error.response?.data?.response?.message
                ?.flat?.()
                ?.some?.(message => String(message).includes('requires property "webhook"'));
            if (requiresWebhookObject) throw error;

            await axios.post(
                `${this.evolutionUrl}/webhook/set/${this.evolutionInstance}`,
                {
                    url: webhookUrl,
                    webhook_by_events: false,
                    events: ['MESSAGES_UPSERT']
                },
                { headers: { 'Content-Type': 'application/json', apikey: this.evolutionApiKey }, timeout: 30000 }
            );
        }

        return { registered: true, instance: this.evolutionInstance };
    }

    /**
     * Envia mensagem para grupo via Evolution API
     */
    async sendToGroup(groupId, message) {
        console.log(`📱 Enviando mensagem para grupo: ${groupId}...`);

        if (this.provider !== 'evolution') {
            console.log('⚠️  Envio para grupo só suportado via Evolution API');
            return await this.sendViaSimulation(groupId, message);
        }

        try {
            const endpoint = `/message/sendText/${this.evolutionInstance}`;
            
            const payload = {
                number: groupId,
                text: message
            };

            const response = await axios.post(
                `${this.evolutionUrl}${endpoint}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.evolutionApiKey
                    },
                    timeout: 30000
                }
            );

            console.log(`✅ Mensagem enviada para grupo`);
            return {
                success: true,
                messageId: response.data?.key?.id || `evo_group_${Date.now()}`,
                provider: 'evolution',
                groupId: groupId
            };
        } catch (error) {
            console.error(`❌ Erro ao enviar para grupo: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lista mensagens não lidas
     */
    async getUnreadMessages() {
        if (this.provider !== 'evolution') {
            return [];
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/chat/findUnread/${this.evolutionInstance}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            return response.data || [];
        } catch (error) {
            console.error('Erro ao buscar mensagens não lidas:', error.message);
            return [];
        }
    }

    /**
     * Obtém QR Code para conexão
     */
    async getQRCode() {
        if (this.provider !== 'evolution') {
            return { success: false, error: 'Evolution API não configurada' };
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/instance/connect/${this.evolutionInstance}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            return {
                success: true,
                qrcode: response.data?.base64 || response.data?.qrcode,
                pairing: response.data?.pairing
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica status da instância
     */
    async getInstanceStatus() {
        if (this.provider !== 'evolution') {
            return { status: 'unknown', provider: this.provider };
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/instance/connectionState/${this.evolutionInstance}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            return {
                status: response.data?.state || 'unknown',
                instance: this.evolutionInstance,
                provider: 'evolution',
                data: response.data
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                provider: 'evolution'
            };
        }
    }

    /**
     * Obtém contatos da instância
     */
    async getContacts() {
        if (this.provider !== 'evolution') {
            return [];
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/chat/whatsappNumbers/${this.evolutionInstance}`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            return response.data || [];
        } catch (error) {
            console.error('Erro ao buscar contatos:', error.message);
            return [];
        }
    }

    /**
     * Resolve o identificador de privacidade de um participante de grupo
     * (`<numero>@lid`) para um número de WhatsApp real (`<numero>@s.whatsapp.net`),
     * consultando os participantes do grupo. Retorna null se não encontrar.
     */
    async resolveParticipantPhone(groupId, lid) {
        if (this.provider !== 'evolution') return null;

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/group/participants/${this.evolutionInstance}`,
                { headers: { apikey: this.evolutionApiKey }, params: { groupJid: groupId }, timeout: 20000 }
            );

            const participants = response.data?.participants || [];
            const match = participants.find(p => p.id === lid);
            if (!match?.phoneNumber) return null;

            return String(match.phoneNumber).replace(/\D/g, '');
        } catch (error) {
            console.error(`Erro ao resolver participante ${lid} do grupo ${groupId}:`, error.message);
            return null;
        }
    }

    /**
     * Busca mensagens de um chat/grupo (paginado, mais recente por página
     * segundo a Evolution API). Usado pelo radar de leads para varrer o
     * histórico; não confirma filtro de data no provedor, então o corte por
     * período é feito pelo chamador com base em `messageTimestamp`.
     */
    async findMessages(remoteJid, { page = 1 } = {}) {
        if (this.provider !== 'evolution') {
            return { records: [], total: 0, pages: 0, currentPage: page };
        }

        try {
            const response = await axios.post(
                `${this.evolutionUrl}/chat/findMessages/${this.evolutionInstance}`,
                { where: { key: { remoteJid } }, page },
                { headers: { apikey: this.evolutionApiKey, 'Content-Type': 'application/json' }, timeout: 30000 }
            );

            const messages = response.data?.messages || {};
            return {
                records: messages.records || [],
                total: messages.total || 0,
                pages: messages.pages || 0,
                currentPage: messages.currentPage || page
            };
        } catch (error) {
            console.error(`Erro ao buscar mensagens de ${remoteJid}:`, error.message);
            return { records: [], total: 0, pages: 0, currentPage: page };
        }
    }

    /**
     * Obtém grupos
     */
    async getGroups() {
        if (this.provider !== 'evolution') {
            return [];
        }

        try {
            const response = await axios.get(
                `${this.evolutionUrl}/group/fetchAllGroups/${this.evolutionInstance}?getParticipants=false`,
                {
                    headers: {
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            return response.data || [];
        } catch (error) {
            console.error('Erro ao buscar grupos:', error.message);
            return [];
        }
    }

    /**
     * Envio via Twilio
     */
    async sendViaTwilio(to, message) {
        try {
            const twilio = require('twilio')(this.twilioAccountSid, this.twilioAuthToken);
            
            const result = await twilio.messages.create({
                from: `whatsapp:${this.twilioWhatsappFrom}`,
                to: `whatsapp:${to}`,
                body: message
            });

            console.log(`✅ Mensagem enviada via Twilio: ${result.sid}`);
            return {
                success: true,
                messageId: result.sid,
                provider: 'twilio'
            };
        } catch (error) {
            console.error(`❌ Erro Twilio: ${error.message}`);
            return {
                success: false,
                error: error.message,
                provider: 'twilio'
            };
        }
    }

    /**
     * Envio via Meta Cloud API (WhatsApp Business)
     */
    async sendViaMetaCloud(to, message) {
        try {
            const result = await axios.post(
                `https://graph.facebook.com/v18.0/${this.metaPhoneId}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: to,
                    type: "text",
                    text: {
                        body: message
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.metaApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Mensagem enviada via Meta: ${result.data.messages[0].id}`);
            return {
                success: true,
                messageId: result.data.messages[0].id,
                provider: 'meta'
            };
        } catch (error) {
            console.error(`❌ Erro Meta: ${error.message}`);
            return {
                success: false,
                error: error.message,
                provider: 'meta'
            };
        }
    }

    /**
     * Simulação de envio (para desenvolvimento/testes)
     */
    async sendViaSimulation(to, message) {
        // Simular delay de envio
        await new Promise(resolve => setTimeout(resolve, 1000));

        const messageId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`✅ [SIMULAÇÃO] Mensagem enviada para ${to}`);
        console.log(`📝 Mensagem: ${message.substring(0, 100)}...`);
        console.log(`🆔 Message ID: ${messageId}`);

        // Salvar em arquivo para referência
        const fs = require('fs');
        const logDir = './output/whatsapp_logs';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logEntry = {
            messageId,
            to,
            message,
            timestamp: new Date().toISOString(),
            provider: 'simulation'
        };

        fs.appendFileSync(
            `${logDir}/messages.jsonl`,
            JSON.stringify(logEntry) + '\n'
        );

        return {
            success: true,
            messageId,
            provider: 'simulation'
        };
    }

    /**
     * Verifica status de uma mensagem
     */
    async getMessageStatus(messageId) {
        if (this.provider === 'twilio') {
            try {
                const twilio = require('twilio')(this.twilioAccountSid, this.twilioAuthToken);
                const message = await twilio.messages(messageId).fetch();
                return {
                    status: message.status,
                    errorCode: message.errorCode,
                    errorMessage: message.errorMessage
                };
            } catch (error) {
                return { status: 'unknown', error: error.message };
            }
        }

        // Para Evolution API, verificar status
        if (this.provider === 'evolution') {
            try {
                const response = await axios.get(
                    `${this.evolutionUrl}/message/findOne/${this.evolutionInstance}/${messageId}`,
                    {
                        headers: {
                            'apikey': this.evolutionApiKey
                        }
                    }
                );
                return response.data;
            } catch (error) {
                return { status: 'unknown', error: error.message };
            }
        }

        // Para simulação, sempre retorna entregue
        return { status: 'delivered' };
    }

    /**
     * Configura webhook para receber respostas
     */
    setupWebhook(app) {
        if (this.provider === 'evolution') {
            // Webhook da Evolution API
            app.post('/webhook/whatsapp/evolution', (req, res) => {
                const body = req.body;
                
                console.log('📩 Webhook Evolution recebido:', JSON.stringify(body).substring(0, 200));

                if (body.event === 'messages.upsert') {
                    const messages = body.data;
                    if (Array.isArray(messages)) {
                        messages.forEach(message => {
                            if (message.fromMe === false) {
                                this.handleIncomingMessage({
                                    from: message.key?.remoteJid,
                                    body: message.message?.conversation || message.message?.extendedTextMessage?.text,
                                    messageId: message.key?.id,
                                    timestamp: message.messageTimestamp,
                                    pushName: message.pushName
                                });
                            }
                        });
                    }
                }

                res.sendStatus(200);
            });

            console.log('✅ Webhook Evolution API configurado em /webhook/whatsapp/evolution');
        }

        if (this.provider === 'meta') {
            // Webhook verification
            app.get('/webhook/whatsapp', (req, res) => {
                const mode = req.query['hub.mode'];
                const token = req.query['hub.verify_token'];
                const challenge = req.query['hub.challenge'];

                if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
                    console.log('✅ Webhook WhatsApp verificado');
                    res.status(200).send(challenge);
                } else {
                    res.sendStatus(403);
                }
            });

            // Webhook para receber mensagens
            app.post('/webhook/whatsapp', (req, res) => {
                const body = req.body;

                if (body.object === 'whatsapp_business_account') {
                    body.entry?.forEach(entry => {
                        entry.changes?.forEach(change => {
                            if (change.value.messages) {
                                change.value.messages.forEach(message => {
                                    this.handleIncomingMessage({
                                        from: message.from,
                                        body: message.text?.body,
                                        messageId: message.id,
                                        timestamp: message.timestamp
                                    });
                                });
                            }
                        });
                    });
                }

                res.sendStatus(200);
            });

            console.log('✅ Webhook Meta WhatsApp configurado');
        }
    }

    /**
     * Processa mensagens recebidas
     */
    handleIncomingMessage(message) {
        console.log(`📩 Mensagem recebida de ${message.pushName || message.from}: ${message.body}`);
        
        // Emitir evento para processamento
        if (this.onMessageReceived) {
            this.onMessageReceived({
                from: message.from,
                body: message.body,
                messageId: message.messageId,
                timestamp: message.timestamp,
                pushName: message.pushName
            });
        }
    }

    /**
     * Registra callback para mensagens recebidas
     */
    onMessage(callback) {
        this.onMessageReceived = callback;
    }
}

module.exports = WhatsAppIntegration;
