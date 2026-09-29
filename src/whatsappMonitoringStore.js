const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function normalizePhone(value) {
    const phone = String(value || '').replace(/\D/g, '');
    if (phone.length < 8 || phone.length > 15) return null;
    return phone;
}

function normalizeGroupId(value) {
    const groupId = String(value || '').trim().toLowerCase();
    if (!/^[^@\s]+@g\.us$/.test(groupId)) return null;
    return groupId;
}

function normalizeTarget(value, type) {
    if (type === 'phone') return { type, value: normalizePhone(value) };
    if (type === 'group') return { type, value: normalizeGroupId(value) };

    const group = normalizeGroupId(value);
    if (group) return { type: 'group', value: group };
    return { type: 'phone', value: normalizePhone(value) };
}

class WhatsAppMonitoringStore {
    constructor(filePath = process.env.WHATSAPP_MONITORING_STORE_PATH || path.join(process.cwd(), 'data', 'whatsapp-monitoring.json')) {
        this.filePath = filePath;
        this.data = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                return {
                    phones: Array.isArray(parsed.phones) ? [...new Set(parsed.phones.map(normalizePhone).filter(Boolean))] : [],
                    groups: Array.isArray(parsed.groups) ? [...new Set(parsed.groups.map(normalizeGroupId).filter(Boolean))] : [],
                    receipts: Array.isArray(parsed.receipts) ? parsed.receipts.slice(-500) : []
                };
            }
        } catch (error) {
            console.error('Falha ao carregar a configuração de monitoramento WhatsApp:', error.message);
        }

        return { phones: [], groups: [], receipts: [] };
    }

    save() {
        const directory = path.dirname(this.filePath);
        fs.mkdirSync(directory, { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify(this.data, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    listTargets() {
        return { phones: [...this.data.phones], groups: [...this.data.groups] };
    }

    addTarget(value, type) {
        const target = normalizeTarget(value, type);
        if (!target.value) throw new Error('Contato ou grupo inválido');

        const collection = target.type === 'group' ? this.data.groups : this.data.phones;
        if (!collection.includes(target.value)) {
            collection.push(target.value);
            this.save();
        }

        return target;
    }

    removeTarget(value, type) {
        const target = normalizeTarget(value, type);
        if (!target.value) throw new Error('Contato ou grupo inválido');

        const key = target.type === 'group' ? 'groups' : 'phones';
        const before = this.data[key].length;
        this.data[key] = this.data[key].filter(item => item !== target.value);
        const removed = this.data[key].length !== before;
        if (removed) this.save();

        return { ...target, removed };
    }

    isAllowed(value) {
        const target = normalizeTarget(value);
        if (!target.value) return false;
        return target.type === 'group'
            ? this.data.groups.includes(target.value)
            : this.data.phones.includes(target.value);
    }

    hasReceipt(eventId) {
        return this.data.receipts.some(receipt => receipt.id === eventId);
    }

    recordReceipt(eventId) {
        if (!eventId || this.hasReceipt(eventId)) return;
        this.data.receipts.push({ id: eventId, receivedAt: new Date().toISOString() });
        this.data.receipts = this.data.receipts.slice(-500);
        this.save();
    }
}

function getNested(object, propertyPath) {
    return propertyPath.split('.').reduce((value, key) => value && value[key], object);
}

function firstValue(object, paths) {
    for (const propertyPath of paths) {
        const value = getNested(object, propertyPath);
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
}

function extractMessageText(message) {
    const value = firstValue(message, [
        'conversation',
        'extendedTextMessage.text',
        'imageMessage.caption',
        'videoMessage.caption',
        'documentMessage.caption',
        'buttonsResponseMessage.selectedDisplayText',
        'listResponseMessage.title'
    ]);
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeInboundEvent(payload) {
    const directMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (payload.phone || payload.groupId || directMessage) {
        const target = payload.groupId || payload.phone || payload.remoteJid;
        const targetInfo = normalizeTarget(target, payload.groupId ? 'group' : undefined);
        const eventId = String(payload.eventId || payload.messageId || payload.id || crypto.createHash('sha256')
            .update(JSON.stringify([targetInfo.value, payload.timestamp || '', directMessage, payload.fromMe || false]))
            .digest('hex'));

        return {
            eventId,
            target: targetInfo.value,
            targetType: targetInfo.type,
            name: typeof payload.name === 'string' ? payload.name : undefined,
            message: directMessage,
            fromMe: payload.fromMe === true || payload.fromMe === 'true',
            timestamp: payload.timestamp || null
        };
    }

    const data = payload.data || payload;
    const key = data.key || {};
    const message = data.message || {};
    const target = key.remoteJid || data.remoteJid;
    const targetInfo = normalizeTarget(target);
    const text = extractMessageText(message);
    const eventIdSource = key.id || data.id;
    const eventId = String(eventIdSource || crypto.createHash('sha256')
        .update(JSON.stringify([targetInfo.value, data.messageTimestamp || data.timestamp || '', text, key.fromMe || false]))
        .digest('hex'));
    const quotedMessageId = message.extendedTextMessage?.contextInfo?.stanzaId
        || message.contextInfo?.stanzaId
        || message.imageMessage?.contextInfo?.stanzaId
        || undefined;
    const senderPhone = key.participant ? String(key.participant).replace(/\D/g, '') : (targetInfo.type === 'phone' ? targetInfo.value : undefined);

    return {
        eventId,
        target: targetInfo.value,
        targetType: targetInfo.type,
        name: data.pushName || data.name || undefined,
        message: text,
        fromMe: key.fromMe === true || key.fromMe === 'true',
        timestamp: data.messageTimestamp || data.timestamp || null,
        quotedMessageId,
        senderPhone
    };
}

module.exports = {
    WhatsAppMonitoringStore,
    normalizePhone,
    normalizeGroupId,
    normalizeTarget,
    normalizeInboundEvent
};
