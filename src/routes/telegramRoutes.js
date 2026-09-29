const express = require('express');
const TelegramIntegration = require('../telegramIntegration');
const { handleTelegramUpdate } = require('../telegramUpdateHandler');

const router = express.Router();
const telegram = new TelegramIntegration();

/**
 * Webhook do Telegram (produção/serverless — a alternativa ao long polling
 * local, que não funciona sem processo contínuo). Responde rápido (a
 * Telegram exige isso) e processa o update em seguida.
 */
router.post('/webhook', async (req, res) => {
    res.status(200).json({ ok: true });
    try {
        await handleTelegramUpdate(req.body, telegram);
    } catch (error) {
        console.error('Erro ao processar webhook do Telegram:', error.message);
    }
});

/**
 * Registra o webhook na Telegram, uma vez, depois do deploy. Chamar com
 * { "url": "https://seu-dominio.vercel.app/api/telegram/webhook" }.
 */
router.post('/setup-webhook', async (req, res) => {
    try {
        const url = req.body?.url;
        if (!url) return res.status(400).json({ error: 'Informe { url: "https://seu-dominio/api/telegram/webhook" }' });
        const result = await telegram.setWebhook(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
