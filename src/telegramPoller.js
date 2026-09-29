/**
 * Telegram Poller - long polling para uso LOCAL apenas (não roda em
 * funções serverless, que não têm processo contínuo — lá, o mesmo
 * processamento acontece via webhook, ver routes/telegramRoutes.js).
 * Funciona sem endereço público, ao contrário do webhook.
 */

const TelegramIntegration = require('./telegramIntegration');
const { handleTelegramUpdate } = require('./telegramUpdateHandler');

class TelegramPoller {
    constructor() {
        this.telegram = new TelegramIntegration();
        this.offset = 0;
        this.running = false;
    }

    start() {
        if (process.env.VERCEL) {
            console.log('ℹ️  Telegram: rodando em função serverless, use o webhook (routes/telegramRoutes.js) em vez do polling local.');
            return;
        }
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
                    await handleTelegramUpdate(update, this.telegram);
                }
            } catch (error) {
                console.error('Erro no loop de polling do Telegram:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}

module.exports = new TelegramPoller();
