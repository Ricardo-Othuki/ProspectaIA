# Lead Radar Specification
## ADDED Requirements

### Requirement: Varrer múltiplos nichos habilitados
O sistema SHALL avaliar mensagens de grupos contra todos os nichos com scan habilitado, mantendo cursores e deduplicação independentes por nicho.

#### Scenario: Mesma mensagem é relevante para dois nichos
- **WHEN** uma mensagem passa nos critérios de dois nichos habilitados
- **THEN** o sistema pode criar registros separados por nicho sem colisão de deduplicação

### Requirement: Filtrar leads por nicho no painel
O sistema SHALL expor a origem de nicho dos leads detectados e permitir que o operador liste leads por nicho.

#### Scenario: Operador abre aba de um nicho
- **WHEN** o operador seleciona uma aba de nicho no radar
- **THEN** o sistema mostra somente leads detectados para aquele nicho, preservando os demais filtros aplicados
