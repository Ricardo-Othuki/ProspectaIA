# Tasks

- [ ] 1.1 `settingsStore.js`: campo `alerts.ownerWhatsappNumber`.
- [ ] 1.2 `leadAgent.js`: `notifyDraftReady(conversation)`, chamado em `startOutreach`, `processLeadResponse`, `applyPriceAuthorization`.
- [ ] 1.3 `telegramPoller.js`: interpretar reply a `kind: 'draft'` (aprovar/descartar/editar) e comandos `/pendentes /rascunho /scan /status`.
- [ ] 1.4 `agentRoutes.js /inbound`: mesmo tratamento de reply a `kind: 'draft'`, restrito a `ownerWhatsappNumber` para comandos.
- [ ] 1.5 Painel: campo "Seu número de WhatsApp (autoriza comandos)".
- [ ] 1.6 `npx openspec validate add-remote-operator-channel`.
- [ ] 1.7 Teste real no Telegram: notificação de rascunho → reply "aprovar" → envio ao destino de teste configurado.
- [ ] 1.8 Teste dos comandos `/pendentes`, `/scan`, `/status`.
