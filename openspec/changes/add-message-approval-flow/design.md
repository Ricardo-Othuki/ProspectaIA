# Design

## Context

Runtime: Node.js/Express (`src/web/server.js`), dashboard estático em `src/web/public/`, estado de conversas hoje em `LeadAgent.conversationState` (um `Map` em memória, perdido a cada restart). Envio de WhatsApp via `WhatsAppIntegration` (`src/whatsappIntegration.js`), provedor Evolution API.

## Goals / Non-Goals

**Goals**
- Nenhuma mensagem sai pelo WhatsApp sem um clique explícito de aprovação do operador.
- Conversas e mensagens sobrevivem a um restart do processo Node.
- Testar a prospecção mandando para um grupo de WhatsApp real, sem tocar no número do lead.

**Non-Goals** (ficam para o change `build-supabase-sales-agent`, quando necessário)
- Autenticação/multi-tenant, RLS por organização.
- Importação de contatos em massa (CSV/XLSX), consentimento/opt-out formal.
- Cadência de campanha, janelas de horário, limites de volume, retries agendados.
- Deploy Vercel / GitHub Actions / n8n.

## Decisions

- **Um rascunho pendente por conversa** (`pendingMessage`), não uma fila de múltiplos rascunhos: simplifica a UI (um card de aprovação por conversa) e casa com o uso atual (uma mensagem de cada vez, esperando resposta do lead ou decisão do operador).
- **Shape de conversa inalterado** para quem já consome (`agentRoutes.js`, `dashboard.js`): o módulo `conversationStore.js` monta o mesmo objeto que o `Map` produzia hoje (`{ ...campos, messages: [...], pendingMessage }`), evitando reescrever toda a camada de rotas/UI.
- **Chave de serviço do Supabase só no backend** (`.env`, nunca no browser): compatível com o requirement de segurança já especificado em `supabase-persistence` no change maior, mesmo sem RLS (não há usuários múltiplos ainda).
- **`/agent/inbound` (webhook de monitoramento) passa a gravar `pendingMessage`** em vez de só devolver uma sugestão na resposta HTTP: unifica os dois caminhos de geração de mensagem (outreach ativo e resposta a mensagem recebida) sob a mesma revisão no painel.
- **Sem fila/agendador**: a geração da mensagem acontece de forma síncrona ao criar a conversa ou ao processar uma resposta do lead, igual ao comportamento atual — só o envio final é que passa a exigir aprovação.

## Schema

Uma única tabela, guardando a conversa inteira (incluindo `messages` e o rascunho pendente) como `jsonb`, em vez de normalizar mensagens em outra tabela: o código atual sempre carrega a conversa inteira, muta o objeto em memória (`push` em `messages`, trocar campos) e regrava o objeto inteiro — o mesmo padrão de um `Map.set(leadId, conversation)`. Uma tabela relacional para mensagens exigiria reescrever esse padrão de mutação em todo `leadAgent.js` sem benefício real na escala atual (um operador, poucas dezenas de conversas). `jsonb` preserva exatamente esse padrão e mantém `conversationStore.js` trivial.

```sql
create table conversations (
  lead_id text primary key,
  lead_name text,
  status text,
  human_controlled boolean default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index on conversations ((data->>'status'));
```

`data` guarda o objeto de conversa completo (mesmo shape usado hoje em memória: `messages`, `pendingMessage`, `pitch`, `testTarget`, etc.). `lead_name`, `status` e `human_controlled` são colunas espelhadas para filtro/índice; `conversationStore.js` sempre lê/escreve a verdade a partir de `data`.

## Risks / Trade-offs

- Sem Supabase configurado (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` ausentes), as rotas de agente devem falhar com erro claro em vez de crashar o processo.
- Tornar métodos antes síncronos (`takeover`, `getConversation`, etc.) em assíncronos exige revisar todos os call sites em `agentRoutes.js` — risco de esquecer um `await`; mitigado revisando cada rota na implementação.
- Uma única mensagem pendente por conversa impede o agente de "pensar à frente" em múltiplos passos — aceitável para o volume atual (testes manuais, um operador).

## Migration Plan

1. Operador cria as tabelas `conversations` e `conversation_messages` no Supabase (SQL em `specs/supabase-persistence/spec.md` / proposta).
2. Deploy do código com as novas variáveis de ambiente.
3. Não há dados antigos a migrar (o `Map` em memória não persistia nada entre restarts).
