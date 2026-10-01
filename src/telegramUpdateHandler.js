/**
 * Telegram Update Handler - lógica compartilhada para processar uma
 * atualização (update) do Telegram, usada tanto pelo long polling local
 * (telegramPoller.js) quanto pelo webhook em produção (routes/telegramRoutes.js).
 * Mesma lógica, dois jeitos de receber o update — sem duplicar nada.
 */

const { correlations, getAlertSettings } = require('./alerts');
const remoteOperator = require('./remoteOperator');
const leadRadar = require('./leadRadar');

async function handleTelegramUpdate(update, telegram) {
    const message = update.message;
    const text = (message?.text || '').trim();
    if (!message || !text || message.from?.is_bot) return;

    // Mensagem de grupo/supergrupo: roda o mesmo pipeline do Radar de
    // Leads (prefiltro → classificação → alerta), independente do chat
    // privado autorizado abaixo — mesmo conceito do WhatsApp, mas só a
    // partir de agora (sem histórico retroativo).
    if (message.chat?.type === 'group' || message.chat?.type === 'supergroup') {
        const groupId = `telegram:${message.chat.id}`;
        await leadRadar.processIncomingGroupMessage({
            groupId,
            groupName: message.chat.title,
            senderName: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || message.from?.username,
            senderJid: message.from?.username ? `@${message.from.username}` : String(message.from?.id || ''),
            message: text,
            messageId: `telegram:${message.chat.id}:${message.message_id}`,
            fromMe: false
        });
        return;
    }

    // Só o chat configurado nas Configurações → Radar de Leads pode
    // comandar/aprovar — o bot pode receber mensagens de qualquer pessoa
    // que o encontre, mas só ouvimos o chat autorizado.
    const { telegramChatId } = await getAlertSettings();
    if (!telegramChatId || String(message.chat?.id) !== String(telegramChatId)) return;

    const replyTo = message.reply_to_message;
    if (replyTo) {
        const correlation = await correlations.get('telegram', replyTo.message_id);
        if (!correlation) return;
        try {
            const responseText = await remoteOperator.handleReply(correlation, text);
            if (responseText) await telegram.sendMessage(responseText, message.chat.id);
        } catch (error) {
            console.error('Erro ao aplicar resposta recebida do Telegram:', error.message);
            await telegram.sendMessage(`⚠️ Erro: ${error.message}`, message.chat.id).catch(() => {});
        }
        return;
    }

    if (text.startsWith('/')) {
        try {
            const responseText = await remoteOperator.handleCommand(text);
            if (responseText) await telegram.sendMessage(responseText, message.chat.id);
        } catch (error) {
            console.error('Erro ao executar comando do Telegram:', error.message);
            await telegram.sendMessage(`⚠️ Erro: ${error.message}`, message.chat.id).catch(() => {});
        }
    }
}

module.exports = { handleTelegramUpdate };
