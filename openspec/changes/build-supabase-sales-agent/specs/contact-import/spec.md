# Contact Import Specification

## ADDED Requirements

### Requirement: Importar contatos com prévia e validação

O sistema SHALL aceitar arquivos CSV e XLSX contendo contatos, mapear colunas, validar telefone, nome, tags, origem e estado de autorização, e mostrar uma prévia antes de persistir a importação.

#### Scenario: Arquivo válido é enviado

- **WHEN** o operador envia um arquivo suportado com colunas mapeáveis
- **THEN** o sistema mostra total de linhas, válidas, inválidas, duplicadas e conflitos antes da confirmação

#### Scenario: Contato sem autorização

- **WHEN** uma linha não possui origem/consentimento ou usa valor não autorizado
- **THEN** o sistema a marca como inelegível e não a ativa em uma campanha

### Requirement: Deduplicar e preservar origem

O sistema SHALL deduplicar contatos por telefone normalizado e preservar a origem, data de importação, tags e registros de consentimento de cada contato.

#### Scenario: Telefone já existe

- **WHEN** uma importação contém telefone já persistido
- **THEN** o sistema apresenta o conflito na prévia e aplica a política escolhida pelo operador sem apagar a trilha de auditoria
