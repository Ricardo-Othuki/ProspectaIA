const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    WhatsAppMonitoringStore,
    normalizePhone,
    normalizeGroupId,
    normalizeInboundEvent
} = require('./src/whatsappMonitoringStore');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsapp-monitoring-'));
const storePath = path.join(temporaryDirectory, 'monitoring.json');
const store = new WhatsAppMonitoringStore(storePath);

assert.deepStrictEqual(store.listTargets(), { phones: [], groups: [] });
assert.strictEqual(normalizePhone('+55 (11) 99999-9999'), '5511999999999');
assert.strictEqual(normalizePhone('123'), null);
assert.strictEqual(normalizeGroupId('1234567890-123456789@g.us'), '1234567890-123456789@g.us');
assert.strictEqual(normalizeGroupId('invalid-group'), null);

assert.deepStrictEqual(store.addTarget('+55 (11) 99999-9999'), { type: 'phone', value: '5511999999999' });
assert.strictEqual(store.isAllowed('5511999999999'), true);
assert.strictEqual(store.isAllowed('5511888888888'), false);
assert.deepStrictEqual(store.addTarget('1234567890-123456789@g.us'), { type: 'group', value: '1234567890-123456789@g.us' });
assert.strictEqual(store.isAllowed('1234567890-123456789@g.us'), true);
assert.strictEqual(store.removeTarget('5511999999999').removed, true);
assert.strictEqual(store.isAllowed('5511999999999'), false);

const direct = normalizeInboundEvent({ phone: '+55 (11) 99999-9999', name: 'Contato', message: 'Olá', eventId: 'direct-1' });
assert.strictEqual(direct.target, '5511999999999');
assert.strictEqual(direct.targetType, 'phone');
assert.strictEqual(direct.message, 'Olá');

const evolution = normalizeInboundEvent({
    event: 'messages.upsert',
    data: {
        key: { id: 'evolution-1', remoteJid: '1234567890-123456789@g.us', fromMe: false },
        pushName: 'Grupo',
        message: { conversation: 'Mensagem do grupo' },
        messageTimestamp: 1700000000
    }
});
assert.strictEqual(evolution.targetType, 'group');
assert.strictEqual(evolution.target, '1234567890-123456789@g.us');
assert.strictEqual(evolution.message, 'Mensagem do grupo');
assert.strictEqual(evolution.eventId, 'evolution-1');

store.recordReceipt('event-1');
assert.strictEqual(store.hasReceipt('event-1'), true);
assert.strictEqual(store.hasReceipt('event-2'), false);

fs.rmSync(temporaryDirectory, { recursive: true, force: true });
console.log('WhatsApp monitoring tests passed');
