# Proposal

## Why

O agente já alerta o operador (WhatsApp/Telegram) quando um lead pergunta valor ou quer fechar, mas não escuta nenhuma resposta a esses alertas — a decisão do operador fica solta nos apps de mensagem, sem voltar para o sistema. É preciso um caminho de volta: responder ao alerta, em qualquer um dos dois canais, deve autorizar o agente a escrever (ainda como rascunho, ainda sujeito a aprovação) a informação liberada.

## What Changes

- Guarda, ao enviar um alerta, o identificador da mensagem em cada canal e a qual lead/pedido ela se refere.
- Escuta respostas (reply) a essas mensagens: no Telegram via long polling (funciona sem endereço público, testável agora); no WhatsApp via o webhook já existente (só ativa de fato após o deploy público).
- Quando a resposta é uma autorização de valor, gera um novo rascunho de mensagem para o lead usando exatamente o que foi autorizado — que segue exigindo aprovação normal antes de qualquer envio.
- Quando a resposta é sobre um fechamento, apenas registra a confirmação (a conversa já está em controle humano nesse ponto).

## Capabilities

### New Capabilities

- `alert-authorization`: correlação de alertas enviados com respostas recebidas, e aplicação da autorização ao rascunho pendente correspondente.

## Impact

- Novo estado local (`data/alert-correlations.json`, `data/telegram-poll-offset.json`), sem novas credenciais.
- Nenhuma mudança no fluxo de aprovação de mensagens — a autorização só libera o que pode ser escrito num rascunho, nunca envia nada sozinha.
- O caminho WhatsApp fica pronto no código mas inerte até o deploy público (mesma limitação já documentada no Radar de Leads).
