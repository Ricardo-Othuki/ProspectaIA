# Design

## Context

`sender_jid` dos leads do radar vem como `@lid` (identificador de privacidade do WhatsApp em grupos), confirmado ao vivo nesta sessão — não é utilizável para envio 1:1. `GET /group/participants/{instance}?groupJid={id}` (Evolution API), também testado ao vivo, resolve isso: retorna `phoneNumber` no formato `<dígitos>@s.whatsapp.net` para cada participante.

O fluxo de aprovação de mensagens (`add-message-approval-flow`) já garante que nenhuma mensagem gerada pelo agente sai sem aprovação explícita do operador. As regras deste change não substituem isso — elas decidem que **conteúdo** o agente tem permissão de sequer propor num rascunho.

## Goals / Non-Goals

**Goals**
- Contatar um lead do radar com uma primeira mensagem contextual (referencia o pedido original), sem repetir trabalho manual.
- Garantir, por construção (não por confiança no modelo), que preço e fechamento sempre passam pelo operador.

**Non-Goals**
- Negociação automática, cálculo de preço, ou fechamento automatizado — está fora de escopo permanentemente, não só por enquanto.
- Raspagem confiável de sites arbitrários — a ferramenta de fetch disponível não garante o conteúdo real da página (testado com othuki.com.br nesta sessão); a base de conhecimento extra é texto colado pelo operador.

## Decisions

- **Function calling para as regras de segurança**, não apenas instrução em texto no prompt: `flag_qualified_lead`, `request_price_authorization` e `request_close_confirmation` são tools reais (mesmo padrão de `schedule_meeting`/`escalate_to_human`, já em produção). Isso dá um ponto de código determinístico para disparar o alerta e, no caso de fechamento, travar a conversa em `humanControlled = true` — não depende só do modelo "lembrar" de nunca falar preço; mesmo que ele mencione o tema, o handler da tool é quem decide o que realmente vai para o rascunho.
- **`request_close_confirmation` força `humanControlled = true`**: depois desse ponto, a conversa para de gerar qualquer coisa automaticamente (mesma trava que já existe para conversas assumidas manualmente) — o operador está literalmente no controle a partir daí, coerente com "nunca avanço sozinho para valores e acordos".
- **Alerta compartilhado (`src/alerts.js`)**: a lógica de "mandar para o grupo de WhatsApp configurado e/ou Telegram" já existe dentro de `leadRadar.js`; extrair para um módulo comum evita duas implementações divergentes do mesmo conceito (canal de alerta configurado no painel).
- **Reaproveitar `startOutreach` para a primeira mensagem**: em vez de um caminho de geração separado, `startRadarOutreach` monta um `pitch` contextual (a pergunta original do lead no grupo) e chama o `startOutreach` já testado — mesmo rascunho pendente, mesmo botões de aprovação no painel, zero duplicação.
- **Base de conhecimento extra como texto colado**: mais simples e confiável do que tentar raspar URLs automaticamente; quando o operador passar um link específico, tenta-se buscar o conteúdo pontualmente e sugerir preenchimento, mas o campo em si é sempre editável livremente.

## Risks / Trade-offs

- `@lid` pode não resolver para todo participante (ex.: quem saiu do grupo, ou a API não expor o número por alguma razão) — nesse caso o contato falha com erro claro, sem tentar adivinhar o número.
- O modelo pode, em tese, gerar uma resposta que menciona preço no MESMO turno em que já deveria ter chamado `request_price_authorization` — mitigado pela regra explícita e reforçada no prompt, mas não 100% garantido por ser um modelo de linguagem; como toda mensagem passa por aprovação humana antes de enviar, esse é o último ponto de checagem real.

## Migration Plan

Nenhuma migração de dados. Funcionalidade nova, ativada por um botão no painel; conversas seguem no mesmo Supabase já em uso.
