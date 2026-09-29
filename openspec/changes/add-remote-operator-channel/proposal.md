# Proposal

## Why

Aprovar rascunhos e acompanhar o sistema hoje exige abrir o painel. O operador quer poder aprovar, descartar ou editar-e-enviar um rascunho, e consultar pendências/disparar uma varredura do radar, direto do WhatsApp ou Telegram — reaproveitando o mesmo mecanismo de correlação por reply já validado para autorização de valor/fechamento.

## What Changes

- Toda vez que um rascunho novo é criado (1ª mensagem, resposta gerada, ou resposta com valor autorizado), o sistema notifica pelos canais de alerta configurados, correlacionado ao lead.
- Responder (reply) a essa notificação aprova (como está ou com o texto da resposta) ou descarta o rascunho, aplicando o mesmo fluxo de aprovação já existente — nenhum envio pula essa etapa.
- Adiciona comandos (`/pendentes`, `/rascunho`, `/scan`, `/status`) para consulta e ação básica sem abrir o painel.
- No WhatsApp (canal compartilhado, em grupo), comandos e aprovações só são aceitos de um número autorizado explicitamente pelo operador; no Telegram, o canal já é privado (1:1 com o bot) por construção.

## Capabilities

### New Capabilities

- `remote-operator-channel`: aprovação de rascunhos e comandos operacionais via WhatsApp/Telegram, com controle de acesso por canal.

## Impact

- Reaproveita infraestrutura já existente (`alerts.js`, `alertCorrelationStore.js`, `telegramPoller.js`) sem novas dependências.
- Novo campo de configuração `alerts.ownerWhatsappNumber` (não secreto, mesmo painel dos demais canais de alerta).
- O caminho WhatsApp completo (comandos/aprovação) só fica operante após o deploy público, pela mesma limitação de webhook já documentada nas features anteriores; o caminho Telegram funciona imediatamente.
