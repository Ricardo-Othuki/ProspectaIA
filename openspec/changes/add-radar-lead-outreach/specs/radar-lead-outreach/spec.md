# Radar Lead Outreach Specification
## ADDED Requirements

### Requirement: Resolver o contato real de um lead do radar
O sistema SHALL resolver o identificador de privacidade (`@lid`) de um lead do radar para um número de WhatsApp utilizável antes de iniciar contato, consultando os participantes do grupo de origem. Se a resolução falhar, o sistema SHALL retornar um erro claro e SHALL NOT tentar adivinhar ou usar o identificador de privacidade diretamente como destino de mensagem.

#### Scenario: Resolução bem-sucedida
- **WHEN** o operador pede para contatar um lead do radar cujo participante ainda está no grupo de origem
- **THEN** o sistema resolve o número real e o usa como destino da conversa

#### Scenario: Falha na resolução
- **WHEN** o participante não é encontrado no grupo (ex.: saiu do grupo)
- **THEN** o sistema recusa iniciar o contato e informa o erro, sem enviar nada

### Requirement: Gerar primeira mensagem contextual como rascunho
O sistema SHALL gerar a primeira mensagem de um contato originado do radar referenciando o pedido original do lead no grupo, e SHALL tratá-la como rascunho pendente de aprovação, seguindo o mesmo fluxo de aprovação já existente para qualquer outra mensagem do agente.

#### Scenario: Contato iniciado a partir de um lead do radar
- **WHEN** o operador aciona "contatar" em um lead do radar
- **THEN** o sistema gera a primeira mensagem referenciando o que o lead pediu no grupo e a mantém pendente, sem enviar
