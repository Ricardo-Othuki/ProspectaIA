/**
 * Auto Responder - Resposta Automática para WhatsApp
 * 
 * Escuta mensagens no WhatsApp via Evolution API e responde automaticamente
 * usando o Agente de IA para prospecção
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { getClient, getModel } = require('./openaiClient');
const { getProfile } = require('./businessProfile');

class AutoResponder {
    constructor() {
        this.openai = getClient();
        this.evolutionUrl = process.env.EVOLUTION_API_URL;
        this.evolutionApiKey = process.env.EVOLUTION_API_KEY;
        this.evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME;
        this.targetGroup = process.env.TARGET_GROUP_ID;
        
        // Estado das conversas
        this.conversations = new Map();
        this.processedMessages = new Set();
        
        // Configurações
        this.config = {
            maxResponseLength: 500,
            responseDelay: 2000, // 2 segundos
            maxInteractions: 10
        };
    }

    /**
     * Inicia o auto responder
     */
    async start() {
        console.log('🤖 Auto Responder iniciado!');
        console.log(`📍 Grupo alvo: ${this.targetGroup}`);
        console.log('⏳ Aguardando mensagens...\n');
        
        // Verificar mensagens periodicamente
        this.startPolling();
    }

    /**
     * Verifica novas mensagens periodicamente
     */
    startPolling() {
        setInterval(async () => {
            await this.checkNewMessages();
        }, 5000); // A cada 5 segundos
    }

    /**
     * Verifica novas mensagens no grupo
     */
    async checkNewMessages() {
        try {
            const response = await axios.get(
                `${this.evolutionUrl}/chat/findUnread/${this.evolutionInstance}`,
                {
                    headers: { 'apikey': this.evolutionApiKey }
                }
            );

            const chats = response.data || [];
            
            for (const chat of chats) {
                if (chat.remoteJid === this.targetGroup && !chat.fromMe) {
                    await this.processGroupMessage(chat);
                }
            }
        } catch (error) {
            // Ignorar erros de polling silenciosamente
        }
    }

    /**
     * Processa mensagem recebida no grupo
     */
    async processGroupMessage(chat) {
        const messageId = chat.id || chat.key?.id;
        
        // Evitar processar mensagens duplicadas
        if (this.processedMessages.has(messageId)) {
            return;
        }
        
        this.processedMessages.add(messageId);
        
        const senderName = chat.pushName || 'Desconhecido';
        const messageText = chat.message?.conversation || 
                           chat.message?.extendedTextMessage?.text || '';
        
        console.log(`📩 Nova mensagem no grupo de ${senderName}: ${messageText}`);
        
        // Gerar resposta com IA
        const response = await this.generateResponse(messageText, senderName);
        
        if (response) {
            // Aguardar um pouco antes de responder
            await this.sleep(this.config.responseDelay);
            
            // Enviar resposta
            await this.sendGroupMessage(response, senderName);
        }
    }

    /**
     * Gera resposta usando IA
     */
    async generateResponse(message, senderName) {
        if (!this.openai) {
            return this.getDefaultResponse(message, senderName);
        }

        const profile = getProfile();
        const biz = profile.business;

        const prompt = `Você é um agente de vendas da Othuki Agência Digital respondendo em um grupo do WhatsApp.

CONTEXTO:
- Grupo: ${process.env.TARGET_GROUP_NAME || 'Grupo de Networking'}
- Pessoa que falou: ${senderName}
- Mensagem: "${message}"

SEU PAPEL:
1. Responder de forma amigável e profissional
2. Identificar se a pessoa tem interesse nos serviços
3. Conduzir a conversa para agendar uma reunião
4. Ser conciso (máximo 3-4 linhas)

SERVIÇOS DA OTHUKI:
- Criação de sites de alta performance
- Automação com IA para atendimento
- Tráfego pago que converte
- Criação de SaaS sob medido

INSTRUÇÕES:
- Se a pessoa demonstrar interesse, ofereça agendar reunião
- Se fizer pergunta, responda objetivamente
- Se não tiver interesse, agradeça educadamente
- Use emojis com moderação
- Assine como "Equipe Othuki"`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: getModel(),
                messages: [
                    { role: "system", content: "Você é um agente de vendas profissional e simpático." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erro ao gerar resposta:', error.message);
            return this.getDefaultResponse(message, senderName);
        }
    }

    /**
     * Resposta padrão caso a IA falhe
     */
    getDefaultResponse(message, senderName) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('quero') || lowerMessage.includes('interesse') || 
            lowerMessage.includes('sim') || lowerMessage.includes('obrigad')) {
            return `Que ótimo ${senderName}! 😊\n\nVou te chamar no privado para agendar uma reunião rápida!\n\nEquipe Othuki 🚀`;
        }
        
        if (lowerMessage.includes('como') || lowerMessage.includes('quanto') || 
            lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
            return `${senderName}, ótima pergunta! 💡\n\nNossos valores são personalizados para cada negócio.\n\nPosso te explicar melhor em uma reunião rápida de 15 min?\n\nEquipe Othuki 🚀`;
        }
        
        if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || 
            lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde')) {
            return `Olá ${senderName}! 👋\n\nTudo bem?\n\nSou da Othuki, ajudamos empresas a crescer com sites, IA e tráfego pago.\n\nQuer saber como podemos ajudar você?\n\nEquipe Othuki 🚀`;
        }
        
        return null;
    }

    /**
     * Envia mensagem no grupo
     */
    async sendGroupMessage(message, recipientName) {
        try {
            // Formatar mensagem mencionando a pessoa (sem @ para evitar erro)
            const formattedMessage = recipientName 
                ? `_*${recipientName}*_\n\n${message}`
                : message;
            
            const response = await axios.post(
                `${this.evolutionUrl}/message/sendText/${this.evolutionInstance}`,
                {
                    number: this.targetGroup,
                    text: formattedMessage
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.evolutionApiKey
                    }
                }
            );

            console.log(`✅ Resposta enviada para ${recipientName || 'grupo'}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao enviar resposta:`, error.message);
            return null;
        }
    }

    /**
     * Envia mensagem inicial no grupo
     */
    async sendInitialMessage() {
        const profile = getProfile();
        
        const message = `🚀 *Olá pessoal! 👋*\n\nSou a Equipe da *Othuki Agência Digital* e estou aqui para apresentar como podemos ajudar vocês a crescer com tecnologia!\n\n✅ *Soluções que oferecemos:*\n• Sites de alta performance\n• Automação com IA para atendimento 24/7\n• Tráfego pago com ROI comprovado\n• Criação de SaaS sob medido\n\n🎯 *Estamos oferecendo:*\n→ Análise gratuita do seu negócio\n→ Consultoria digital personalizada\n→ Reunião online via Google Meet\n\n💬 *Quer saber mais?*\nBasta responder \"QUERO\" ou mandar sua dúvida!\n\nEstamos aqui para ajudar! 😊\n\n🌐 othuki.com.br`;

        return await this.sendGroupMessage(message);
    }

    /**
     * Utilitário: sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const app = express();
    app.use(express.json());
    
    const responder = new AutoResponder();
    
    // Endpoint webhook para Evolution API
    app.post('/webhook/evolution', (req, res) => {
        const body = req.body;
        
        if (body.event === 'messages.upsert') {
            const messages = body.data;
            if (Array.isArray(messages)) {
                messages.forEach(msg => {
                    if (!msg.fromMe && msg.key?.remoteJid === process.env.TARGET_GROUP_ID) {
                        responder.processGroupMessage(msg);
                    }
                });
            }
        }
        
        res.sendStatus(200);
    });
    
    // Endpoint para enviar mensagem inicial
    app.get('/start', async (req, res) => {
        await responder.sendInitialMessage();
        res.json({ success: true, message: 'Mensagem inicial enviada!' });
    });
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', conversations: responder.conversations.size });
    });
    
    const PORT = process.env.AUTO_RESPONDER_PORT || 3002;
    
    app.listen(PORT, async () => {
        console.log(`🤖 Auto Responder rodando na porta ${PORT}`);
        console.log(`\n📋 Endpoints:`);
        console.log(`   POST /webhook/evolution - Webhook da Evolution API`);
        console.log(`   GET  /start             - Enviar mensagem inicial`);
        console.log(`   GET  /health            - Verificar status`);
        console.log(`\n🚀 Para iniciar a prospecção:`);
        console.log(`   curl http://localhost:${PORT}/start\n`);
        
        await responder.start();
    });
}

module.exports = AutoResponder;