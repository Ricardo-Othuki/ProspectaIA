const express = require('express');
const crypto = require('crypto');
const LeadAgent = require('../leadAgent');
const WhatsAppIntegration = require('../whatsappIntegration');
const { WhatsAppMonitoringStore, normalizeInboundEvent, normalizeTarget } = require('../whatsappMonitoringStore');
const leadRadar = require('../leadRadar');
const leadRadarStore = require('../leadRadarStore');
const { correlations: alertCorrelations, getAlertSettings } = require('../alerts');
const remoteOperator = require('../remoteOperator');

const router = express.Router();
const agent = new LeadAgent();
const whatsapp = new WhatsAppIntegration();
const monitoringStore = new WhatsAppMonitoringStore();

const checkConfig = (req, res, next) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            error: 'OpenAI API key not configured',
            message: 'Execute ./configure-api.sh para configurar'
        });
    }
    next();
};

const requireMonitoringAdmin = (req, res, next) => {
    const token = process.env.WHATSAPP_MONITORING_ADMIN_TOKEN;
    if (!token || req.get('x-whatsapp-monitoring-token') !== token) {
        return res.status(403).json({ error: 'Monitoring administration is not authorized' });
    }
    next();
};

function getTargetFromRequest(body) {
    const requestedType = body.type || (body.groupId ? 'group' : undefined);
    return normalizeTarget(body.target || body.phone || body.groupId, requestedType);
}

function eventSummary(event) {
    return {
        eventId: event.eventId,
        target: event.target,
        targetType: event.targetType,
        senderPhone: event.senderPhone || null,
        senderJid: event.senderJid || null,
        timestamp: event.timestamp || null
    };
}

async function getInboundConversationTarget(event) {
    const candidates = [
        event.targetType === 'group' && event.senderPhone ? event.senderPhone : null,
        event.target
    ].filter(Boolean);

    for (const target of [...new Set(candidates)]) {
        const conversation = await agent.getConversation(target);
        if (conversation) return { target, conversation };
    }

    if (event.senderJid) {
        const radarLead = await leadRadarStore.getLatestLeadBySenderJid(event.senderJid);
        if (radarLead) {
            const conversation = await agent.getConversationByRadarLeadId(radarLead.id);
            if (conversation) return { target: conversation.leadId, conversation };
        }
    }

    return { target: candidates[0] || null, conversation: null };
}

router.get('/monitoring/status', requireMonitoringAdmin, async (req, res) => {
    const provider = await whatsapp.getEvolutionStatus();
    res.json({ success: true, monitoring: await monitoringStore.listTargets(), provider });
});

router.get('/monitoring/targets', requireMonitoringAdmin, async (req, res) => {
    res.json({ success: true, targets: await monitoringStore.listTargets() });
});

router.post('/monitoring/targets', requireMonitoringAdmin, async (req, res) => {
    try {
        const target = getTargetFromRequest(req.body || {});
        if (!target.value) return res.status(400).json({ error: 'Invalid phone number or group ID' });
        res.status(201).json({ success: true, target: await monitoringStore.addTarget(target.value, target.type) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/monitoring/targets', requireMonitoringAdmin, async (req, res) => {
    try {
        const target = getTargetFromRequest(req.body || {});
        if (!target.value) return res.status(400).json({ error: 'Invalid phone number or group ID' });
        res.json({ success: true, target: await monitoringStore.removeTarget(target.value, target.type) });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/monitoring/webhook/register', requireMonitoringAdmin, async (req, res) => {
    try {
        const result = await whatsapp.registerEvolutionWebhook(req.body?.url || process.env.WHATSAPP_MONITORING_WEBHOOK_URL);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/inbound', async (req, res) => {
    try {
        const event = normalizeInboundEvent(req.body || {});
        if (!event.target || !event.message) {
            return res.status(400).json({ error: 'Missing valid target or message content' });
        }
        const conversationTarget = await getInboundConversationTarget(event);

        if (event.fromMe) {
            if (await monitoringStore.hasReceipt(event.eventId)) {
                return res.json({ success: true, ignored: true, reason: 'duplicate', event: eventSummary(event) });
            }

            if (!conversationTarget.conversation) {
                return res.json({ success: true, ignored: true, reason: 'from_me_no_conversation', event: eventSummary(event) });
            }

            await monitoringStore.recordReceipt(event.eventId);
            const conversation = await agent.recordHumanOutboundMessage(conversationTarget.target, event.message, {
                senderName: 'WhatsApp Web',
                externalMessageId: event.eventId
            });

            return res.json({
                success: true,
                event: eventSummary(event),
                synced: true,
                direction: 'outbound',
                humanControlled: true,
                status: conversation.status
            });
        }

        // Canal de operação remota por WhatsApp: só aceita comando/resposta
        // do número explicitamente autorizado (o alerta vai para um grupo,
        // que pode ter outras pessoas). Só chega aqui de fato depois do
        // deploy público (a Evolution não alcança um servidor local).
        const { ownerWhatsappNumber } = await getAlertSettings();
        const isOwner = Boolean(ownerWhatsappNumber && event.senderPhone && event.senderPhone === String(ownerWhatsappNumber).replace(/\D/g, ''));

        if (isOwner && event.quotedMessageId) {
            const correlation = await alertCorrelations.get('whatsapp', event.quotedMessageId);
            if (correlation) {
                remoteOperator.handleReply(correlation, event.message)
                    .catch(error => console.error('Erro ao aplicar resposta via WhatsApp:', error.message));
            }
        } else if (isOwner && event.message.trim().startsWith('/')) {
            remoteOperator.handleCommand(event.message)
                .then(responseText => {
                    if (responseText) return whatsapp.sendMessage(event.target, responseText, { isGroup: event.targetType === 'group' });
                })
                .catch(error => console.error('Erro ao executar comando via WhatsApp:', error.message));
        }

        // Radar de leads: roda para QUALQUER grupo não excluído, independente
        // da allowlist do fluxo de vendas abaixo (são pipelines independentes).
        if (event.targetType === 'group') {
            leadRadar.processIncomingGroupMessage({
                groupId: event.target,
                senderName: event.name,
                senderJid: event.senderJid,
                message: event.message,
                messageId: event.eventId
            }).catch(error => console.error('Erro no radar de leads (evento em tempo real):', error.message));
        }

        const targetAllowed = await monitoringStore.isAllowed(event.target);
        const participantAllowed = conversationTarget.target && conversationTarget.target !== event.target
            ? await monitoringStore.isAllowed(conversationTarget.target)
            : false;
        if (!targetAllowed && !participantAllowed && !conversationTarget.conversation) {
            return res.json({ success: true, ignored: true, reason: 'not_allowed', event: eventSummary(event) });
        }
        if (await monitoringStore.hasReceipt(event.eventId)) {
            return res.json({ success: true, ignored: true, reason: 'duplicate', event: eventSummary(event) });
        }

        await monitoringStore.recordReceipt(event.eventId);
        const result = await agent.handleInboundMessage({
            phone: conversationTarget.target && !String(conversationTarget.target).endsWith('@g.us')
                ? conversationTarget.target
                : (event.targetType === 'phone' ? event.target : event.senderPhone),
            groupId: conversationTarget.target && String(conversationTarget.target).endsWith('@g.us')
                ? conversationTarget.target
                : (event.targetType === 'group' && !event.senderPhone ? event.target : undefined),
            name: event.name,
            message: event.message,
            send: false
        });

        res.json({
            success: true,
            event: eventSummary(event),
            suggestion: result.reply,
            intent: result.intent,
            meetingLink: result.meetingLink || null,
            sent: false,
            humanControlled: result.humanControlled,
            status: result.status
        });
    } catch (error) {
        console.error('Error handling inbound monitoring event:', error.message);
        res.status(500).json({ error: 'Unable to process inbound monitoring event' });
    }
});

router.post('/monitoring/send', requireMonitoringAdmin, async (req, res) => {
    try {
        const target = getTargetFromRequest(req.body || {});
        const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        if (!target.value || !message) return res.status(400).json({ error: 'Valid target and message are required' });
        if (!await monitoringStore.isAllowed(target.value)) {
            return res.status(403).json({ error: 'Target is not allowed for monitoring' });
        }

        const result = await whatsapp.sendMessage(target.value, message, { isGroup: target.type === 'group' });
        res.status(result.success ? 200 : 502).json({
            success: result.success,
            sent: result.success,
            messageId: result.messageId,
            provider: result.provider,
            error: result.success ? undefined : result.error
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to send reviewed message' });
    }
});

router.post('/outreach', checkConfig, async (req, res) => {
    try {
        const { leadId, leadName, leadPhone, leadRating, leadWebsite, campaignStyle, pitch, testTarget } = req.body;
        if (!leadId || !leadName || !leadPhone) {
            return res.status(400).json({ error: 'Missing required fields: leadId, leadName, leadPhone' });
        }
        const conversation = await agent.startOutreach({
            id: leadId,
            name: leadName,
            phone: leadPhone,
            rating: leadRating,
            website: leadWebsite
        }, campaignStyle || 'balanced', { pitch, testTarget });
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error starting outreach:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/messages/:leadId/approve', checkConfig, async (req, res) => {
    try {
        const { editedContent, target } = req.body || {};
        const result = await agent.approvePendingMessage(req.params.leadId, { editedContent, target });
        if (!result) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation: result.conversation, sendResult: result.sendResult });
    } catch (error) {
        console.error('Error approving pending message:', error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post('/messages/:leadId/discard', checkConfig, async (req, res) => {
    try {
        const conversation = await agent.discardPendingMessage(req.params.leadId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error discarding pending message:', error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post('/response', checkConfig, async (req, res) => {
    try {
        const { leadId, message } = req.body;
        if (!leadId || !message) return res.status(400).json({ error: 'Missing required fields: leadId, message' });
        const result = await agent.processLeadResponse(leadId, message);
        if (!result) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error processing lead response:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/takeover', checkConfig, async (req, res) => {
    try {
        const { leadId } = req.body;
        if (!leadId) return res.status(400).json({ error: 'Missing required field: leadId' });
        const result = await agent.takeover(leadId);
        if (!result) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation: result });
    } catch (error) {
        console.error('Error taking over conversation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/release', checkConfig, async (req, res) => {
    try {
        const { leadId } = req.body;
        if (!leadId) return res.status(400).json({ error: 'Missing required field: leadId' });
        const result = await agent.releaseControl(leadId);
        if (!result) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation: result });
    } catch (error) {
        console.error('Error releasing conversation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/manual-message', checkConfig, async (req, res) => {
    try {
        const { leadId, message, senderName } = req.body || {};
        if (!leadId || !message) return res.status(400).json({ error: 'Missing required fields: leadId, message' });
        const conversation = await agent.sendManualMessage(leadId, message, senderName || 'Atendente');
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error sending manual message:', error.message);
        res.status(400).json({ error: error.message });
    }
});

router.get('/conversations', checkConfig, async (req, res) => {
    try {
        res.json({ success: true, ...(await agent.getConversationsStatus()) });
    } catch (error) {
        console.error('Error loading conversations:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/conversations/:leadId', checkConfig, async (req, res) => {
    try {
        const conversation = await agent.getConversation(req.params.leadId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error loading conversation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
