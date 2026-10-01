# Lead Radar Specification
## ADDED Requirements

### Requirement: Usar nicho ativo no radar
O sistema SHALL usar o nicho ativo configurado para montar o prefiltro local e o prompt de classificação do radar, mantendo fallback para o perfil principal quando nenhum nicho ativo válido existir.

#### Scenario: Mensagem contém palavra-chave do nicho ativo
- **WHEN** uma mensagem de grupo contém uma palavra-chave configurada no nicho ativo
- **THEN** o sistema considera a mensagem candidata para classificação por IA

#### Scenario: Mensagem contém termo negativo do nicho
- **WHEN** uma mensagem de grupo contém termo negativo configurado no nicho ativo
- **THEN** o sistema descarta a mensagem sem chamar IA nem criar lead

#### Scenario: Nenhum nicho ativo
- **WHEN** nenhum nicho ativo válido está configurado
- **THEN** o sistema usa o prefiltro existente baseado no perfil de negócio e palavras genéricas
