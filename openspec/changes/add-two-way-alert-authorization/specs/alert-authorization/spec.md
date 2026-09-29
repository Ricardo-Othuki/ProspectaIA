# Alert Authorization Specification
## ADDED Requirements

### Requirement: Correlacionar alertas enviados com suas respostas
O sistema SHALL guardar, para cada alerta enviado por canal (WhatsApp e/ou Telegram), o identificador da mensagem e a qual lead e tipo de pedido (valor ou fechamento) ela se refere, de forma que uma resposta recebida como reply a essa mensagem seja identificável sem ambiguidade.

#### Scenario: Alerta de valor é enviado
- **WHEN** o sistema pede autorização de valor para um lead
- **THEN** o identificador da mensagem enviada em cada canal fica associado a esse lead e a esse tipo de pedido

### Requirement: Aplicar autorização de valor recebida por reply
O sistema SHALL, ao receber uma resposta que é reply a um alerta de autorização de valor correlacionado, gerar um novo rascunho de mensagem para o lead correspondente usando o valor autorizado, e SHALL manter esse rascunho sujeito à aprovação normal antes de qualquer envio.

#### Scenario: Operador responde um alerta de preço no Telegram
- **WHEN** o operador responde (reply), no Telegram, a um alerta de autorização de valor
- **THEN** o sistema gera um novo rascunho pendente para o lead com o valor autorizado, sem enviar nada automaticamente

#### Scenario: Resposta não é reply a nenhum alerta correlacionado
- **WHEN** uma mensagem chega em um dos canais sem ser reply a um alerta conhecido
- **THEN** o sistema não tenta aplicar nenhuma autorização a partir dela

### Requirement: Registrar confirmação de fechamento
O sistema SHALL registrar a resposta do operador a um alerta de confirmação de fechamento, associada ao lead correspondente, sem enviar nenhuma mensagem automaticamente a partir dela.

#### Scenario: Operador confirma um fechamento pelo Telegram
- **WHEN** o operador responde a um alerta de confirmação de fechamento
- **THEN** o sistema registra a confirmação na conversa correspondente
