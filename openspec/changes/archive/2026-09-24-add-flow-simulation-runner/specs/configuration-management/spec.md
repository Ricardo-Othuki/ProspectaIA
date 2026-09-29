# Configuration Management Specification

## ADDED Requirements

### Requirement: Iniciar simulação segura pelo painel

O sistema SHALL permitir que o operador inicie e consulte uma simulação de fluxo pelo painel, sem aceitar secrets nem efetuar efeitos externos.

#### Scenario: Operador inicia uma simulação pelo painel

- **WHEN** o operador seleciona um cenário de simulação disponível
- **THEN** o painel apresenta o progresso e o relatório resumido em PT-BR
