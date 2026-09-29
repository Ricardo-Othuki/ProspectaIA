# Design

## Context

`alerts.js::sendOwnerAlert(text, context)` já envia e correlaciona mensagens por `{leadId, kind}` (`kind: 'price'|'close'`, de `add-two-way-alert-authorization`). `telegramPoller.js` já escuta replies via long polling e já resolve a correlação. `LeadAgent` já expõe `approvePendingMessage`/`discardPendingMessage`. Este change generaliza esse mesmo mecanismo para `kind: 'draft'` e adiciona um parser simples de comandos de texto.

## Goals / Non-Goals

**Goals**
- Aprovar/descartar/editar-e-enviar um rascunho respondendo a uma notificação, em vez de precisar do painel.
- Comandos básicos de consulta/ação sem abrir o painel.
- WhatsApp não pode virar um canal aberto: só o número autorizado pelo operador comanda algo.

**Non-Goals**
- Não é um canal para "conversar com o Claude Code" — é só a interface do sistema de vendas/radar já existente.
- Não interpreta linguagem natural livre nos comandos — são comandos literais (`/pendentes`, etc.) e respostas de reply com regras simples (sim/não/texto = novo conteúdo).

## Decisions

- **Mesma correlação por reply**, novo `kind: 'draft'`: evita um segundo mecanismo de correlação; `telegramPoller.js`/`agentRoutes.js /inbound` só precisam de mais um `case`.
- **Regra de interpretação da resposta a um rascunho**: texto vazio ou variações de "sim/aprovar/ok" → aprova como está; variações de "não/cancelar/descartar" → descarta; qualquer outro texto → aprova usando esse texto (equivalente ao "Alterar e enviar" do painel). Simples e previsível, sem depender de outra chamada de IA para interpretar a intenção.
- **Comandos só via mensagem começando com `/`**, roteados por um parser mínimo (sem framework de bot) — consistente com o tamanho atual do projeto.
- **WhatsApp exige número autorizado** (`alerts.ownerWhatsappNumber`) porque o alerta vai para um grupo, que pode ter outras pessoas; Telegram não precisa disso por já ser 1:1.

## Risks / Trade-offs

- Sem `ownerWhatsappNumber` configurado, comandos/aprovações por WhatsApp ficam desativados por padrão (falha segura) — só recebe alertas, como já era.
- Interpretar "sim"/"não" por palavra-chave pode falhar para frases fora do esperado; nesse caso, o texto vira "editar e enviar" (o pior caso é enviar um texto não intencional, mitigado por continuar sendo uma decisão explícita do operador ao responder).

## Migration Plan

Nenhuma migração — ativa assim que o código sobe; comandos por WhatsApp inertes até `ownerWhatsappNumber` ser configurado e o servidor estar publicamente acessível.
