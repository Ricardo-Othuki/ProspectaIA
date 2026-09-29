# Proposal

## Why

O operador participa de 124 grupos de WhatsApp onde, ocasionalmente, alguém pede um serviço que a Othuki vende (site, automação com IA, agente de IA, tráfego pago, SEO, SaaS). Hoje isso só é percebido se o operador ler manualmente cada grupo. É preciso um radar automático que leia essas mensagens, identifique pedidos relevantes dos últimos 7 dias, priorize e alerte em tempo real — gastando o mínimo possível de tokens de IA, já que a maior parte do volume de 124 grupos é conversa irrelevante.

## What Changes

- Adiciona um prefiltro local por palavras-chave (derivadas do perfil de negócio) que roda antes de qualquer chamada de IA, descartando a esmagadora maioria das mensagens sem custo.
- Adiciona classificação em lote por um modelo de IA dedicado e mais barato (`gemini-2.5-flash-lite`), separado do modelo usado no agente de vendas, só para as mensagens que passam no prefiltro.
- Adiciona busca de histórico de mensagens por grupo via Evolution API (`findMessages`), com cursor incremental por grupo para nunca reprocessar a mesma mensagem.
- Persiste os leads de grupo detectados no Supabase, com prioridade (alta/média/baixa), resumo da necessidade e motivo da relevância.
- Adiciona uma nova área no painel ("Radar de Leads") com filtros por período (até 7 dias), prioridade e grupo, e ações de marcar contatado/dispensado.
- Adiciona alertas automáticos por WhatsApp e/ou Telegram quando um lead de prioridade alta/média é detectado — em tempo real quando o processo estiver publicamente acessível (via o webhook de mensagens já registrado na Evolution), e por um scan periódico local enquanto isso não acontece.
- Permite excluir grupos irrelevantes (ex.: grupos de curso) da varredura, numa lista local simples.

## Capabilities

### New Capabilities

- `lead-radar`: detecção, priorização, listagem filtrável e alerta de leads encontrados em grupos de WhatsApp monitorados, com controle explícito de custo de IA (prefiltro + lote + modelo dedicado).

### Modified Capabilities

- `supabase-persistence`: adiciona tabelas para leads de grupo e cursores de varredura por grupo, além das já existentes para conversas.
- `whatsapp-monitoring`: o webhook de mensagens (`/api/agent/inbound`), hoje restrito à allowlist do fluxo de vendas, passa também a alimentar o radar de leads para mensagens de grupo, independente dessa allowlist.

## Impact

- Novas variáveis de ambiente: `LEAD_RADAR_MODEL` (opcional, default `gemini-2.5-flash-lite`), `LEAD_RADAR_POLL_MINUTES` (opcional), `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` (opcionais, para alerta via Telegram).
- Duas novas tabelas no Supabase já conectado ao projeto; sem migração de dados existentes.
- Sem mudança no fluxo de aprovação de mensagens de vendas já existente — o radar é somente leitura/alerta, nunca envia mensagens a um grupo ou lead de grupo automaticamente.
