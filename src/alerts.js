/**
 * Alerts - envio de avisos ao operador pelos canais configurados no painel
 * (Radar de Leads → Grupos monitorados e alertas): grupo de WhatsApp e/ou
 * chat do Telegram. Reaproveitado pelo radar de leads e pelo agente de
 * vendas, para nunca ter duas implementações divergentes do mesmo conceito.
 */

require('dotenv').config();
const WhatsAppIntegration = require('./whatsappIntegration');
const TelegramIntegration = require('./telegramIntegration');
const { SettingsStore } = require('./settingsStore');
const { AlertCorrelationStore } = require('./alertCorrelationStore');

const whatsapp = new WhatsAppIntegration();
const telegram = new TelegramIntegration();
const correlations = new AlertCorrelationStore();

function getAlertSettings() {
    const saved = (new SettingsStore().get().alerts) || {};
    return {
        whatsappGroupId: saved.whatsappGroupId || process.env.TARGET_GROUP_ID || '',
        telegramChatId: saved.telegramChatId || process.env.TELEGRAM_CHAT_ID || ''
    };
}

/**
 * Envia o alerta pelos canais configurados. `context`, quando informado
 * ({leadId, kind: 'price'|'close'}), grava a correlação da mensagem enviada
 * em cada canal, para que uma resposta (reply) a ela seja aplicada ao lead
 * certo (ver alertCorrelationStore.js).
 */
async function sendOwnerAlert(text, context) {
    const { whatsappGroupId, telegramChatId } = getAlertSettings();
    const ownerPhone = process.env.OWNER_NOTIFY_PHONE;

    if (whatsappGroupId || ownerPhone) {
        try {
            const target = whatsappGroupId || ownerPhone;
            const result = await whatsapp.sendMessage(target, text, { isGroup: Boolean(whatsappGroupId) });
            if (context && result?.messageId) correlations.save('whatsapp', result.messageId, context);
        } catch (error) {
            console.error('Falha ao alertar via WhatsApp:', error.message);
        }
    }
    if (telegram.isConfigured(telegramChatId)) {
        const result = await telegram.sendMessage(text, telegramChatId);
        if (context && result?.messageId) correlations.save('telegram', result.messageId, context);
    }
}

module.exports = { sendOwnerAlert, getAlertSettings, correlations };
