---
tags: [radar-de-leads, whatsapp, automacao, othuki]
---

# Radar de Leads em Grupos do WhatsApp

Nova capability (2026-09-28), independente da prospecção de [[Prospecção Just - Advocacia Previdenciária|Just]]: varre os 124 grupos de WhatsApp do usuário em busca de pedidos reais de serviços da **Othuki Agência Digital** (sites, automação com IA, agentes de IA, tráfego pago, SEO, SaaS sob medida).

## Como funciona (custo mínimo de IA)
1. Prefiltro local por palavra-chave (0 tokens) — só passa quem menciona um serviço.
2. Classificação em lote pelo modelo barato `gemini-2.5-flash-lite` (separado do modelo do agente de vendas).
3. Cursor por grupo — nunca reprocessa a mesma mensagem.
4. Dedupe por `message_id` no Supabase.

## Onde está o código
- `src/leadRadar.js` (núcleo), `src/leadRadarStore.js` (Supabase), `src/leadRadarGroupsStore.js` (grupos excluídos, local), `src/telegramIntegration.js`.
- Rotas: `/api/lead-radar/*`.
- Painel: aba "Radar de Leads".
- Spec: `openspec/changes/add-group-lead-radar/`.

## Status (2026-09-28)
- [x] SQL rodado no Supabase, tabelas confirmadas.
- [x] Primeiro scan completo: 124 grupos, 21 candidatos pré-filtrados, 4 leads reais encontrados.
- [x] Alertas configurados e testados: WhatsApp no grupo "Grupo de Networking" (mesmo do teste), Telegram no bot @prospectaia_bot (chat de Ricardo). Configuráveis pelo painel, aba Radar de Leads → "Grupos monitorados e alertas" (o token do bot continua só no `.env`, por ser segredo).
- [x] Varredura automática ligada (30 min) e botão de liga/desliga no painel (2026-09-29).
- [x] **Telegram também virou fonte do radar** (2026-09-29): o bot precisa ser adicionado manualmente a cada grupo (Telegram não deixa bot se auto-adicionar, nem herdar grupos da conta pessoal sem automação de conta arriscada — decidido não fazer isso). Uma vez no grupo, com modo privacidade desativado no BotFather, funciona em **tempo real** — mas sem histórico retroativo como o WhatsApp (a API de bot do Telegram não tem "buscar mensagens antigas"). Testado com sucesso no grupo "Teste-Scan ProspectaIA": lead #5 detectado e alertado.
- [ ] "Tempo real" de verdade no WhatsApp (webhook instantâneo) depende do deploy (Vercel) — até lá, usa varredura manual ("Escanear agora") ou o poller automático.

## Depois disso
Último passo definido pelo usuário: versionar no GitHub e publicar no Vercel, só após essa feature estar validada.
