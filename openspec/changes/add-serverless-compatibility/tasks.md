# Tasks

## 1. Estado local → Supabase

- [x] 1.1 Tabelas `app_settings`, `radar_excluded_groups`, `alert_correlations`, `dashboard_events`.
- [x] 1.2 `settingsStore.js` assíncrono + Supabase; atualizar call sites.
- [x] 1.3 `leadRadarGroupsStore.js` assíncrono + Supabase; atualizar call sites.
- [x] 1.4 `alertCorrelationStore.js` assíncrono + Supabase; atualizar call sites.

## 2. Telegram webhook

- [x] 2.1 Extrair `handleUpdate` para `src/telegramUpdateHandler.js`.
- [x] 2.2 `TelegramIntegration.setWebhook(url)`.
- [x] 2.3 Rota `POST /api/telegram/webhook`.

## 3. Pollers condicionais + cron

- [x] 3.1 Guardar `leadRadar.startPoller`/`telegramPoller.start` com `!process.env.VERCEL`.
- [x] 3.2 Rota `POST /api/cron/scan` protegida por `CRON_SECRET`.
- [x] 3.3 `vercel.json` com o cron (1x/dia, ajustável).

## 4. Eventos: SSE → polling

- [x] 4.1 `src/eventsStore.js` (Supabase).
- [x] 4.2 `server.js`: listener grava no Supabase além de `broadcastSSE`.
- [x] 4.3 Rota `GET /api/events/poll`.
- [x] 4.4 `dashboard.js`: trocar EventSource por polling.

## 5. Empacotamento Vercel

- [x] 5.1 `server.js` exporta o app, `listen` só em `require.main === module`.
- [x] 5.2 `api/index.js`.
- [x] 5.3 `vercel.json` (rewrites + cron).

## 6. Verificação

- [x] 6.1 `npx openspec validate add-serverless-compatibility`.
- [x] 6.2 Testar tudo localmente sem regressão.
- [x] 6.3 Simular rota de cron e webhook do Telegram localmente.
