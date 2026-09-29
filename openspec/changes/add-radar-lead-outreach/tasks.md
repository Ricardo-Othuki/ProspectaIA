# Tasks

## 1. Resolução de contato

- [ ] 1.1 `whatsappIntegration.js::resolveParticipantPhone(groupId, lid)`.

## 2. Alerta compartilhado

- [ ] 2.1 `src/alerts.js::sendOwnerAlert(text)`.
- [ ] 2.2 Refatorar `leadRadar.js::sendAlerts` para usar `sendOwnerAlert`.

## 3. Regras de segurança no agente

- [ ] 3.1 3 novas tools em `AGENT_TOOLS`: `flag_qualified_lead`, `request_price_authorization`, `request_close_confirmation`.
- [ ] 3.2 Handlers das tools em `generateTurn` (alerta + efeitos: `qualified`, `humanControlled`).
- [ ] 3.3 Regras inegociáveis no `getAgentSystemPrompt`.

## 4. Contato a partir do radar

- [ ] 4.1 `leadAgent.js::startRadarOutreach(radarLead, options)`.
- [ ] 4.2 `POST /api/lead-radar/leads/:id/contact`.
- [ ] 4.3 Botão "Contatar este lead" no card do painel (Radar de Leads → Conversas).

## 5. Base de conhecimento extra

- [ ] 5.1 `data/knowledge-extra.txt` + `src/knowledgeSources.js`.
- [ ] 5.2 Campo no formulário de Configurações + inclusão em `getKnowledgeContext()`.

## 6. Execução e verificação

- [ ] 6.1 `npx openspec validate add-radar-lead-outreach`.
- [ ] 6.2 Contatar Rafael Oliveira (lead #3): gerar rascunho, mostrar para aprovação, não enviar sozinho.
- [ ] 6.3 Teste local de pergunta de preço: confirmar alerta disparado e resposta sem número.
