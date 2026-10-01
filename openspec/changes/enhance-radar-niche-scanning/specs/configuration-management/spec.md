# configuration-management Specification
## ADDED Requirements

### Requirement: Recriar campo de nicho com IA
O sistema SHALL permitir que o operador selecione um campo de uma configuração de nicho e informe uma regra ou prompt para a IA recriar somente aquele campo, usando o nicho completo como contexto.

#### Scenario: Operador recria palavras-chave
- **WHEN** o operador seleciona o campo de palavras-chave, informa uma regra e solicita reescrita
- **THEN** o sistema retorna uma nova lista de palavras-chave alinhada ao restante do nicho sem persistir automaticamente

### Requirement: Controlar scan por nicho
O sistema SHALL permitir ativar ou pausar a participação de cada nicho nas varreduras do radar independentemente dos demais nichos.

#### Scenario: Nicho pausado
- **WHEN** um nicho está com scan desativado
- **THEN** o radar não usa suas palavras-chave nem seu prompt durante varreduras automáticas ou manuais
