/**
 * Telegram Integration Module - envio mínimo de alertas via Bot API.
 * Crie um bot com @BotFather no Telegram para obter TELEGRAM_BOT_TOKEN,
 * e descubra seu TELEGRAM_CHAT_ID (ex.: enviando /start ao bot e consultando
 * https://api.telegram.org/bot<token>/getUpdates).
 */

require('dotenv').config();
const axios = require('axios');

class TelegramIntegration {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
    }

    isConfigured(chatId) {
        return Boolean(this.botToken && (chatId || this.chatId));
    }

    async sendMessage(text, chatId) {
        const target = chatId || this.chatId;
        if (!this.botToken || !target) {
            return { success: false, error: 'Telegram não configurado (token do bot ou chat id ausente)' };
        }

        try {
            const response = await axios.post(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                { chat_id: target, text, parse_mode: 'HTML', disable_web_page_preview: true },
                { timeout: 15000 }
            );
            return { success: true, messageId: response.data?.result?.message_id };
        } catch (error) {
            console.error('❌ Erro ao enviar alerta no Telegram:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Long polling: busca atualizações novas a partir de `offset`, esperando
     * até `timeoutSeconds` por algo novo antes de responder vazio. Usado
     * para escutar respostas sem precisar de um endereço público.
     */
    async getUpdates(offset, timeoutSeconds = 25) {
        if (!this.botToken) return [];

        try {
            const response = await axios.get(
                `https://api.telegram.org/bot${this.botToken}/getUpdates`,
                { params: { offset, timeout: timeoutSeconds }, timeout: (timeoutSeconds + 10) * 1000 }
            );
            return response.data?.result || [];
        } catch (error) {
            console.error('Erro ao buscar atualizações do Telegram:', error.message);
            return [];
        }
    }
}

module.exports = TelegramIntegration;
