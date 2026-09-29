# Design

## Context

`sendOwnerAlert` (de `add-radar-lead-outreach`) já manda texto pro WhatsApp (grupo configurado) e/ou Telegram (chat configurado), e ambos os SDKs/APIs devolvem um id de mensagem no envio. Telegram e WhatsApp suportam "responder" (reply) a uma mensagem específica, e ambos os payloads de entrada carregam o id da mensagem citada.

## Goals / Non-Goals

**Goals**
- Fechar o loop: alerta enviado → operador responde no app que preferir → sistema aplica a decisão a um novo rascunho pendente.
- Funcionar de verdade hoje pelo menos por um canal (Telegram), sem depender de deploy.

**Non-Goals**
- Enviar qualquer coisa automaticamente a partir da autorização — o rascunho gerado ainda passa pela aprovação normal.
- Parsing sofisticado de linguagem natural da resposta do operador — o texto da resposta é usado como está (é o próprio operador escrevendo o valor/decisão, não precisa de interpretação).

## Decisions

- **Correlação por reply-to-message, não por texto digitado**: mais natural (o operador só responde a mensagem, sem decorar formato) e mais confiável do que tentar casar por palavras-chave.
- **Telegram por long polling**: não exige webhook/endereço público, portanto funciona e é testável imediatamente — ao contrário do caminho WhatsApp, que depende do deploy (mesma limitação já registrada no Radar de Leads para tempo real).
- **`applyPriceAuthorization` gera um novo rascunho, não envia nada**: mantém a mesma garantia de "toda mensagem passa por aprovação" que already existe desde `add-message-approval-flow` — a autorização de valor muda o que o agente pode escrever, não se precisa aprovar.
- **Correlação e offset do Telegram em arquivo local**, não Supabase: é estado operacional efêmero (qual mensagem virou qual alerta, até onde já lemos o Telegram), não dado de negócio — mesmo raciocínio já usado para grupos excluídos do radar.

## Risks / Trade-offs

- Se o operador responder um alerta antigo sem usar "reply" (responder como mensagem solta), o sistema não consegue correlacionar — aceitável, a mecânica de "responder à mensagem" é simples e nativa dos dois apps.
- Long polling do Telegram mantém uma conexão HTTP ocupada com timeout longo; irrelevante na escala de um único operador.

## Migration Plan

Nenhuma migração — funcionalidade nova, ativa assim que `TELEGRAM_BOT_TOKEN` estiver configurado (já está).
