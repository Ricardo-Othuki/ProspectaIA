---
tags: [seguranca, telegram, whatsapp, automacao]
---

# Autorização de duas vias (Telegram/WhatsApp)

Fecha o loop dos alertas: responder (reply de verdade, não só digitar a palavra) a um alerta de preço ou fechamento autoriza o agente a escrever — ainda como rascunho, ainda exigindo aprovação normal.

## Regras inegociáveis (implementadas em `src/leadAgent.js`, function calling)
1. Nunca informa valor sem autorização — `request_price_authorization`.
2. Nunca confirma fechamento sozinho — `request_close_confirmation` (transfere para controle humano).
3. Alerta quando lead é qualificado — `flag_qualified_lead`.

## Como funciona
- Correlação por **reply real** (não por texto/hashtag digitado) — `src/alertCorrelationStore.js`.
- **Telegram**: long polling (`src/telegramPoller.js`), funciona sem deploy — testado e validado com o lead [[Leads/Rafael Oliveira (Radar)|Rafael Oliveira]] em 2026-09-28.
- **WhatsApp**: código pronto (`agentRoutes.js /inbound` + `quotedMessageId`), mas só ativa depois do deploy público (a Evolution não alcança o servidor local).

## Pegadinha encontrada no teste
No Telegram, "responder" precisa ser o gesto nativo do app (deslizar/long-press → Responder), não digitar a palavra "reply" na mensagem — só o gesto nativo anexa o `reply_to_message` que o sistema usa pra correlacionar.

Spec: `openspec/changes/add-two-way-alert-authorization/`.
