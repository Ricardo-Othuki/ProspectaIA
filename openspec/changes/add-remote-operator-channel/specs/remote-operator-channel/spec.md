# Remote Operator Channel Specification
## ADDED Requirements

### Requirement: Notificar quando um rascunho é criado
O sistema SHALL notificar o operador, pelos canais de alerta configurados, sempre que um rascunho de mensagem for criado para qualquer conversa, correlacionando a notificação ao lead correspondente.

#### Scenario: Novo rascunho gerado
- **WHEN** o sistema gera um rascunho de mensagem (primeiro contato, resposta ao lead, ou resposta com valor autorizado)
- **THEN** o operador recebe uma notificação com o texto do rascunho, correlacionada a essa conversa

### Requirement: Aprovar ou descartar um rascunho por reply
O sistema SHALL, ao receber uma resposta (reply) a uma notificação de rascunho, aplicar a decisão do operador: aprovar e enviar o rascunho como está, descartar sem enviar, ou aprovar enviando o texto da resposta no lugar do rascunho original.

#### Scenario: Operador aprova respondendo "aprovar"
- **WHEN** o operador responde "aprovar" (ou variação equivalente) a uma notificação de rascunho
- **THEN** o sistema envia o rascunho original ao destino da conversa

#### Scenario: Operador responde com texto novo
- **WHEN** o operador responde com um texto que não é uma confirmação nem uma negação
- **THEN** o sistema envia esse texto no lugar do rascunho original, marcando a mensagem como editada

### Requirement: Restringir comandos por WhatsApp a um número autorizado
O sistema SHALL NOT executar nenhum comando ou aprovação recebido por WhatsApp a menos que a mensagem venha do número explicitamente autorizado pelo operador. Sem esse número configurado, o sistema SHALL apenas continuar enviando alertas por WhatsApp, sem aceitar comandos por esse canal.

#### Scenario: Mensagem de um número não autorizado no grupo de alertas
- **WHEN** uma mensagem chega no grupo de alertas de um número diferente do configurado como autorizado
- **THEN** o sistema não executa nenhuma ação a partir dela

### Requirement: Comandos de consulta e ação básica
O sistema SHALL suportar, nos canais autorizados, os comandos `/pendentes` (lista conversas com rascunho pendente), `/rascunho <id>` (mostra o texto de um rascunho específico), `/scan` (dispara uma varredura do radar de leads) e `/status` (resumo de pendências).

#### Scenario: Operador pede a lista de pendências
- **WHEN** o operador envia `/pendentes` em um canal autorizado
- **THEN** o sistema responde com a lista de conversas que têm rascunho aguardando aprovação
