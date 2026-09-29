/**
 * Telegram Poller - via long polling (funciona sem endereço público,
 * ao contrário do webhook do WhatsApp):
 * 1) escuta respostas/comandos no chat privado autorizado (operação remota);
 * 2) roda o mesmo pipeline do Radar de Leads (prefiltro → classificação →
 *    alerta) para toda mensagem recebida em grupos do Telegram onde o bot
 *    foi adicionado como membro — em tempo real, a partir do momento em que
 *    o bot entra no grupo (a API de bots do Telegram não permite buscar
 *    histórico anterior, diferente da Evolution API no WhatsApp).
 */

const fs = require('fs');
const path = require('path');
const TelegramIntegration = require('./telegramIntegration');
const { correlations, getAlertSettings } = require('./alerts');
const remoteOperator = require('./remoteOperator');
const leadRadar = require('./leadRadar');

const OFFSET_FILE = path.join(process.cwd(), 'data', 'telegram-poll-offset.json');

function loadOffset() {
    try {
        if (fs.existsSync(OFFSET_FILE)) return JSON.parse(fs.readFileSync(OFFSET_FILE, 'utf8')).offset || 0;
    } catch (error) {
        console.error('Falha ao carregar offset do Telegram:', error.message);
    }
    return 0;
}

function saveOffset(offset) {
    fs.mkdirSync(path.dirname(OFFSET_FILE), { recursive: true });
    fs.writeFileSync(OFFSET_FILE, JSON.stringify({ offset }), { mode: 0o600 });
}

class TelegramPoller {
    constructor() {
        this.telegram = new TelegramIntegration();
        this.offset = loadOffset();
        this.running = false;
    }

    start() {
        if (!this.telegram.botToken) {
            console.log('ℹ️  Telegram: token não configurado, autorização por reply desativada.');
            return;
        }
        if (this.running) return;
        this.running = true;

        console.log('📨 Telegram: escutando respostas de autorização (long polling)...');
        this.loop();
    }

    async loop() {
        while (this.running) {
            try {
                const updates = await this.telegram.getUpdates(this.offset ? this.offset + 1 : undefined, 25);
                for (const update of updates) {
                    this.offset = update.update_id;
                    await this.handleUpdate(update);
                }
                if (updates.length) saveOffset(this.offset);
            } catch (error) {
                console.error('Erro no loop de polling do Telegram:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async handleUpdate(update) {
        const message = update.message;
        const text = (message?.text || '').trim();
        if (!message || !text || message.from?.is_bot) return;

        // Mensagem de grupo/supergrupo: roda o mesmo pipeline do Radar de
        // Leads (prefiltro → classificação → alerta), independente do chat
        // privado autorizado abaixo — mesmo conceito do WhatsApp, mas só a
        // partir de agora (sem histórico retroativo).
        if (message.chat?.type === 'group' || message.chat?.type === 'supergroup') {
            const groupId = `telegram:${message.chat.id}`;
            leadRadar.processIncomingGroupMessage({
                groupId,
                groupName: message.chat.title,
                senderName: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || message.from?.username,
                senderJid: message.from?.username ? `@${message.from.username}` : String(message.from?.id || ''),
                message: text,
                messageId: `telegram:${message.chat.id}:${message.message_id}`,
                fromMe: false
            }).catch(error => console.error('Erro no radar de leads (Telegram):', error.message));
            return;
        }

        // Só o chat configurado nas Configurações → Radar de Leads pode
        // comandar/aprovar — o bot pode receber mensagens de qualquer pessoa
        // que o encontre, mas só ouvimos o chat autorizado.
        const { telegramChatId } = getAlertSettings();
        if (!telegramChatId || String(message.chat?.id) !== String(telegramChatId)) return;

        const replyTo = message.reply_to_message;
        if (replyTo) {
            const correlation = correlations.get('telegram', replyTo.message_id);
            if (!correlation) return;
            try {
                const responseText = await remoteOperator.handleReply(correlation, text);
                if (responseText) await this.telegram.sendMessage(responseText, message.chat.id);
            } catch (error) {
                console.error('Erro ao aplicar resposta recebida do Telegram:', error.message);
                await this.telegram.sendMessage(`⚠️ Erro: ${error.message}`, message.chat.id).catch(() => {});
            }
            return;
        }

        if (text.startsWith('/')) {
            try {
                const responseText = await remoteOperator.handleCommand(text);
                if (responseText) await this.telegram.sendMessage(responseText, message.chat.id);
            } catch (error) {
                console.error('Erro ao executar comando do Telegram:', error.message);
                await this.telegram.sendMessage(`⚠️ Erro: ${error.message}`, message.chat.id).catch(() => {});
            }
        }
    }
}

module.exports = new TelegramPoller();
