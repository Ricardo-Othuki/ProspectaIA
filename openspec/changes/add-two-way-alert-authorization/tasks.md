# Tasks

- [ ] 1.1 `src/alertCorrelationStore.js` (local, save/get por canal+messageId).
- [ ] 1.2 `alerts.js::sendOwnerAlert` grava correlação por canal enviado.
- [ ] 1.3 Tools de preço/fechamento em `leadAgent.js` passam `{leadId, kind}` e gravam `conversation.pendingAuthorization`.
- [ ] 1.4 `leadAgent.js::applyPriceAuthorization(leadId, texto)`.
- [ ] 1.5 `src/telegramPoller.js` (long polling, offset local) + start no boot do servidor.
- [ ] 1.6 `whatsappMonitoringStore.js::normalizeInboundEvent` captura id da mensagem citada.
- [ ] 1.7 `agentRoutes.js::/inbound` aplica autorização quando o evento é reply a uma mensagem correlacionada.
- [ ] 1.8 Painel: aviso de "aguardando autorização" no card de rascunho pendente.
- [ ] 1.9 `npx openspec validate add-two-way-alert-authorization`.
- [ ] 1.10 Teste real: reply no Telegram a um alerta de preço → novo rascunho com o valor autorizado.
