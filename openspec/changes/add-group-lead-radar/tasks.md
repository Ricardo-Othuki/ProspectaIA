# Tasks

## 1. Persistência

- [ ] 1.1 Operador cria `group_radar_leads` e `group_radar_cursors` no Supabase (SQL no design/proposta).
- [ ] 1.2 `src/leadRadarStore.js`: CRUD assíncrono (leads + cursores).
- [ ] 1.3 `src/leadRadarGroupsStore.js`: JSON local de grupos excluídos.

## 2. Coleta e prefiltro

- [ ] 2.1 `whatsappIntegration.js::findMessages(remoteJid, { page })`.
- [ ] 2.2 `src/leadRadar.js::buildKeywordFilter()` a partir de `business-profile.json`.
- [ ] 2.3 `src/leadRadar.js::scanGroups({ sinceDays, maxPagesPerGroup })`: lista grupos, pula excluídos, busca mensagens, aplica prefiltro, respeita cursor.

## 3. Classificação e alerta

- [ ] 3.1 Classificação em lote via `LEAD_RADAR_MODEL` (default `gemini-2.5-flash-lite`), `reasoning_effort: 'none'`.
- [ ] 3.2 Persistir leads (dedupe por `message_id`) e atualizar cursor por grupo.
- [ ] 3.3 `src/telegramIntegration.js` (sendMessage via Bot API).
- [ ] 3.4 `sendAlerts(lead)`: WhatsApp (dono) e/ou Telegram, conforme configurado.
- [ ] 3.5 `processIncomingGroupMessage(event)` para o caminho em tempo real (webhook).
- [ ] 3.6 Poller opcional (`LEAD_RADAR_POLL_MINUTES`) chamando `scanGroups` em intervalo.

## 4. Rotas

- [ ] 4.1 `src/routes/leadRadarRoutes.js`: `GET /groups`, `POST/DELETE /groups/:id/exclude`, `POST /scan`, `GET /leads`, `POST /leads/:id/status`.
- [ ] 4.2 Montar em `/api/lead-radar` no `server.js`.
- [ ] 4.3 `agentRoutes.js::/inbound`: fan-out para `leadRadar.processIncomingGroupMessage` em eventos de grupo.

## 5. Painel

- [ ] 5.1 Nova seção "Radar de Leads": filtros (período, prioridade, grupo), lista com ações.
- [ ] 5.2 Botão "Escanear agora" + indicação da última varredura.
- [ ] 5.3 Card de configuração: grupos monitorados (excluir/incluir) e status dos canais de alerta.

## 6. Verificação

- [ ] 6.1 `npx openspec validate add-group-lead-radar`.
- [ ] 6.2 Rodar scan manual, conferir no log candidatos pré-filtrados vs. enviados à IA.
- [ ] 6.3 Teste ponta a ponta com mensagem simulada num grupo de teste.
- [ ] 6.4 Confirmar alerta recebido (WhatsApp e/ou Telegram).
