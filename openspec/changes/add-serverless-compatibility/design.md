# Design

## Context

Pesquisa feita nesta sessão confirma os limites reais da Vercel em 2026: cron no plano Hobby roda no máximo 1x/dia (expressões mais frequentes falham no deploy); Pro permite granularidade de 1 minuto. Timeout de função é curto no Hobby, até 300s no Pro. Fontes: [Vercel cron limits](https://crontap.com/blog/vercel-cron-hourly-limit-and-how-to-beat-it), [Vercel Functions Limits](https://vercel.com/docs/functions/limitations), [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).

## Goals / Non-Goals

**Goals**
- Rodar corretamente como função serverless, sem depender de processo contínuo nem sistema de arquivos gravável.
- Não regredir nada do uso local atual.
- Tempo real de verdade via webhook (evento), não via cron (intervalo).

**Non-Goals**
- Não adiciona um serviço de pub/sub externo (Pusher/Ably/Supabase Realtime) — polling curto é suficiente para o volume atual (um operador).
- Não muda nenhuma regra de negócio (aprovação, segurança comercial, ocultação de identidade) — é só sobre onde/como o processo roda.

## Decisions

- **`process.env.VERCEL` como interruptor**: a própria Vercel define essa variável em runtime; uso isso para decidir entre "iniciar pollers locais" e "expor rotas de cron/webhook", em vez de uma flag nova para manter — menos configuração manual, menos chance de esquecer de setar algo.
- **Webhook do Telegram só em produção, polling só local**: webhook exige HTTPS público, que só existe depois do deploy; local continua com long polling, sem mudança de experiência para quem está desenvolvendo.
- **Cron é backfill, não o mecanismo de tempo real**: dado o limite de 1x/dia no Hobby, contar com cron para "tempo real" seria enganoso. O tempo real de verdade vem dos webhooks (Evolution já registrado, Telegram passa a ter um também), que disparam por evento, não por intervalo.
- **Polling no painel em vez de SSE**: uma conexão SSE aberta numa invocação serverless nunca recebe eventos emitidos por outra invocação (não há memória compartilhada entre elas) — SSE simplesmente não funciona em produção nesse modelo. Polling a cada ~8s contra um log de eventos persistido funciona igual local e em produção, com uma única implementação.
- **`api/index.js` fino, sem duplicar lógica**: só re-exporta o app Express já existente; `server.js` guarda `app.listen(...)` atrás de `require.main === module` para continuar funcionando com `npm run web` sem mudança.

## Risks / Trade-offs

- Notificações do sino deixam de ser instantâneas (latência de alguns segundos do polling) — aceitável para o volume e uso atual (um operador).
- Cron de 1x/dia no Hobby significa que, se os webhooks falharem por algum motivo, o backfill só roda uma vez por dia — mitigado pelo fato de que o caminho principal (webhook) já cobre o caso comum; cron é rede de segurança, não o caminho crítico.
- Migrar `settingsStore`/`leadRadarGroupsStore`/`alertCorrelationStore` para assíncrono exige revisar todos os call sites — risco de esquecer um `await`; mitigado revisando cada um explicitamente durante a implementação, igual já foi feito nos changes anteriores.

## Migration Plan

1. Operador cria as tabelas novas no Supabase (SQL na proposta/tasks).
2. Deploy do código — nenhuma migração de dado necessária (arquivos JSON locais têm pouco estado, recriável).
3. Depois do primeiro deploy público: registrar o webhook do Telegram e confirmar que o webhook do WhatsApp (já existente) aponta para a URL pública.
