/**
 * Alert Correlation Store - associa a mensagem de um alerta enviado
 * (WhatsApp e/ou Telegram) ao lead e ao tipo de pedido (preço/fechamento),
 * para que uma resposta (reply) a essa mensagem seja aplicada ao lead certo.
 * Estado operacional local, não dado de negócio — mesmo padrão de
 * leadRadarGroupsStore.js.
 */

const fs = require('fs');
const path = require('path');

class AlertCorrelationStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'alert-correlations.json')) {
        this.filePath = filePath;
        this.entries = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        } catch (error) {
            console.error('Falha ao carregar correlações de alerta:', error.message);
        }
        return {};
    }

    persist() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify(this.entries, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    key(channel, messageId) {
        return `${channel}:${messageId}`;
    }

    save(channel, messageId, { leadId, kind }) {
        if (!messageId) return;
        this.entries[this.key(channel, messageId)] = { leadId, kind, createdAt: new Date().toISOString() };
        this.persist();
    }

    get(channel, messageId) {
        if (!messageId) return null;
        return this.entries[this.key(channel, messageId)] || null;
    }
}

module.exports = { AlertCorrelationStore };
