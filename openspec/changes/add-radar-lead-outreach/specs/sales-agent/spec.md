# Sales Agent Specification
## ADDED Requirements

### Requirement: Nunca informar valores sem autorização explícita
O sistema SHALL NOT gerar, em nenhuma mensagem de nenhuma conversa, um valor, preço ou faixa de preço específico. Quando um lead perguntar sobre valores, o sistema SHALL alertar o operador com a pergunta exata e pedir autorização de quanto negociar, e a resposta gerada para o lead naquele turno SHALL NOT conter nenhum número de preço.

#### Scenario: Lead pergunta o preço
- **WHEN** um lead pergunta quanto custa um serviço
- **THEN** o sistema alerta o operador pedindo autorização de valor e responde ao lead sem mencionar nenhum número

### Requirement: Nunca fechar ou confirmar acordo sem confirmação explícita
O sistema SHALL NOT confirmar, sozinho, qualquer fechamento, proposta ou acordo comercial com um lead. Ao identificar que a conversa chegou a esse ponto, o sistema SHALL alertar o operador com um resumo do que está sendo negociado, pedir confirmação explícita, informar ao lead que a conversa será transferida para o responsável, e SHALL passar a conversa para controle humano, interrompendo qualquer geração automática a partir daí.

#### Scenario: Lead está pronto para fechar
- **WHEN** a conversa indica que o lead quer avançar para contratar/fechar
- **THEN** o sistema alerta o operador com o resumo do que está sendo negociado, avisa o lead que vai transferir para o responsável, e a conversa passa a exigir controle humano para qualquer nova mensagem

### Requirement: Alertar quando um lead for qualificado
O sistema SHALL alertar o operador, uma única vez por conversa, quando concluir que um lead tem necessidade real e alinhada aos serviços oferecidos, com um resumo dessa necessidade.

#### Scenario: Necessidade confirmada
- **WHEN** o agente conclui, ao longo da conversa, que o lead precisa mesmo de um serviço oferecido
- **THEN** o sistema envia um alerta ao operador com o resumo, e não repete esse alerta para a mesma conversa
