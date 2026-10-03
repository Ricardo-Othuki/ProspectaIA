const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.VERCEL = '';

const {
    WhatsAppMonitoringStore,
    normalizePhone,
    normalizeGroupId,
    normalizeInboundEvent
} = require('./src/whatsappMonitoringStore');

(async () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsapp-monitoring-'));
    const storePath = path.join(temporaryDirectory, 'monitoring.json');
    const store = new WhatsAppMonitoringStore(storePath);

    assert.deepStrictEqual(await store.listTargets(), { phones: [], groups: [] });
    assert.strictEqual(normalizePhone('+55 (11) 99999-9999'), '5511999999999');
    assert.strictEqual(normalizePhone('123'), null);
    assert.strictEqual(normalizeGroupId('1234567890-123456789@g.us'), '1234567890-123456789@g.us');
    assert.strictEqual(normalizeGroupId('invalid-group'), null);

    assert.deepStrictEqual(await store.addTarget('+55 (11) 99999-9999'), { type: 'phone', value: '5511999999999' });
    assert.strictEqual(await store.isAllowed('5511999999999'), true);
    assert.strictEqual(await store.isAllowed('5511888888888'), false);
    assert.deepStrictEqual(await store.addTarget('1234567890-123456789@g.us'), { type: 'group', value: '1234567890-123456789@g.us' });
    assert.strictEqual(await store.isAllowed('1234567890-123456789@g.us'), true);
    assert.strictEqual((await store.removeTarget('5511999999999')).removed, true);
    assert.strictEqual(await store.isAllowed('5511999999999'), false);

    const direct = normalizeInboundEvent({ phone: '+55 (11) 99999-9999', name: 'Contato', message: 'Olá', eventId: 'direct-1' });
    assert.strictEqual(direct.target, '5511999999999');
    assert.strictEqual(direct.targetType, 'phone');
    assert.strictEqual(direct.message, 'Olá');

    const evolution = normalizeInboundEvent({
        event: 'messages.upsert',
        data: {
            key: { id: 'evolution-1', remoteJid: '1234567890-123456789@g.us', participant: '55 11 97777-7777@s.whatsapp.net', fromMe: false },
            pushName: 'Grupo',
            message: { conversation: 'Mensagem do grupo' },
            messageTimestamp: 1700000000
        }
    });
    assert.strictEqual(evolution.targetType, 'group');
    assert.strictEqual(evolution.target, '1234567890-123456789@g.us');
    assert.strictEqual(evolution.message, 'Mensagem do grupo');
    assert.strictEqual(evolution.eventId, 'evolution-1');
    assert.strictEqual(evolution.senderPhone, '5511977777777');
    assert.strictEqual(evolution.senderJid, '55 11 97777-7777@s.whatsapp.net');

    const { shouldIgnoreGroupEventForConversation } = require('./src/routes/agentRoutes')._private;
    assert.strictEqual(
        shouldIgnoreGroupEventForConversation(evolution, { target: evolution.senderPhone, conversation: { leadId: evolution.senderPhone } }),
        true
    );
    assert.strictEqual(
        shouldIgnoreGroupEventForConversation(evolution, { target: evolution.target, conversation: { leadId: evolution.target, isGroup: true } }),
        false
    );
    assert.strictEqual(
        shouldIgnoreGroupEventForConversation(direct, { target: direct.target, conversation: { leadId: direct.target } }),
        false
    );

    await store.recordReceipt('event-1');
    assert.strictEqual(await store.hasReceipt('event-1'), true);
    assert.strictEqual(await store.hasReceipt('event-2'), false);

    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    console.log('WhatsApp monitoring tests passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
