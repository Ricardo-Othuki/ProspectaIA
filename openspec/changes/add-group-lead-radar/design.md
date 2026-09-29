# Design

## Context

Instância Evolution (`Othuki`) com 124 grupos. Evolution expõe `GET /group/fetchAllGroups/{instance}` (já usado em `whatsappIntegration.js::getGroups`) e `POST /chat/findMessages/{instance}` (testado ao vivo nesta sessão: `{"where":{"key":{"remoteJid":"<id>"}}}` → `{ messages: { total, pages, currentPage, records: [...] } }`, paginado, sem filtro de data confirmado). O webhook de eventos (`MESSAGES_UPSERT`) já está registrado apontando para `/api/agent/inbound`, hoje só usado pelo fluxo de vendas com allowlist.

## Goals / Non-Goals

**Goals**
- Encontrar pedidos de serviço da Othuki em mensagens de grupo dos últimos 7 dias.
- Gastar o mínimo de tokens de IA possível (prefiltro + lote + modelo barato).
- Priorizar (alta/média/baixa) e listar num painel filtrável.
- Alertar em tempo real (ou o mais perto disso possível antes do deploy) por WhatsApp/Telegram.

**Non-Goals**
- Responder ou interagir automaticamente nos grupos (o radar só observa e alerta; qualquer contato com o lead encontrado é manual, fora deste change).
- Garantir cobertura 100% do histórico de grupos de altíssimo volume (o corte por páginas por grupo é uma aproximação documentada, não uma garantia).
- Autenticação/multi-usuário — mesmo escopo de operador único já estabelecido em `add-message-approval-flow`.

## Decisions

- **Prefiltro antes de tudo**: nenhuma mensagem chega à IA sem antes bater em pelo menos uma palavra-chave de serviço (derivada de `business-profile.json`). Decisão central de custo — sem isso, classificar ~100+ mensagens/dia por grupo × 124 grupos via IA seria caro e desnecessário.
- **Modelo separado para classificação** (`LEAD_RADAR_MODEL`, default `gemini-2.5-flash-lite`, confirmado ao vivo nesta sessão): o agente de vendas continua no modelo configurado em `OPENAI_MODEL` (conversas exigem mais qualidade); classificação de lead é uma tarefa simples e não deve pagar o preço de um modelo maior.
- **Classificação em lote**: várias mensagens candidatas numa única chamada (JSON array de entrada/saída), reduzindo overhead de system prompt repetido por mensagem.
- **Cursor por grupo em vez de reprocessar tudo a cada scan**: `group_radar_cursors.last_message_timestamp` guarda até onde cada grupo já foi varrido; um novo scan só busca mensagens mais novas que isso (ou os últimos 7 dias, o que for mais restritivo).
- **Corte por paginação, não por filtro de API**: como o filtro de data do `findMessages` não foi confirmado, busca-se um número limitado de páginas por grupo (mais recentes primeiro, quando a ordenação permitir; senão, todas as páginas buscadas são filtradas pelo timestamp no cliente) e corta-se pelo timestamp de 7 dias no lado do código.
- **Exclusão de grupos é config local, não dado de negócio**: fica em `data/lead-radar-groups.json`, no mesmo padrão de `whatsappMonitoringStore.js`/`settingsStore.js` — não precisa de tabela no Supabase.
- **Webhook único reaproveitado**: em vez de registrar um segundo webhook na Evolution, o handler existente de `/api/agent/inbound` passa a chamar também `leadRadar.processIncomingGroupMessage` para eventos de grupo, além do fluxo de vendas já existente — os dois pipelines são independentes (um não bloqueia o outro).
- **Poller como ponte até o deploy**: como o webhook só alcança o processo depois de publicado (Vercel, definido como última etapa pelo operador), um `setInterval` opcional (`LEAD_RADAR_POLL_MINUTES`) roda o mesmo `scanGroups` em background — mesmo pipeline, mesmo controle de custo.

## Risks / Trade-offs

- Sem filtro de data confirmado na Evolution, grupos com volume muito alto podem ter mensagens de mais de 7 dias fora do alcance das páginas buscadas, ou mensagens dentro de 7 dias que exigam mais páginas que o limite configurado — mitigado com um `maxPagesPerGroup` configurável e log de quantas páginas foram necessárias por grupo, para ajuste manual se necessário.
- 124 grupos × múltiplas páginas por scan completo geram bastante tráfego HTTP para a Evolution API (não para a IA) — aceitável pois é só leitura, mas o scan completo não deve rodar com frequência agressiva (daí o poller ser em minutos, não segundos).
- Falso positivo/negativo do prefiltro por palavra-chave: aceitável como primeira camada barata; a classificação por IA é quem decide de fato `isLead`/prioridade sobre os candidatos.

## Migration Plan

1. Operador roda o SQL das duas novas tabelas no Supabase já conectado (mesmo projeto usado por `add-message-approval-flow`).
2. Deploy do código com as novas variáveis de ambiente (todas opcionais exceto as já existentes do Supabase).
3. Primeiro `POST /api/lead-radar/scan` faz o backfill inicial dos últimos 7 dias; cursores ficam gravados a partir daí.
