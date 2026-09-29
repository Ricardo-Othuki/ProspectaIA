# Production Deployment Specification

## ADDED Requirements

### Requirement: Implantar com secrets externos ao repositório

O sistema SHALL usar variáveis de ambiente configuradas no Vercel e GitHub Secrets, sem versionar credenciais. Deploys SHALL executar validações antes de promoção.

#### Scenario: Deploy de produção é acionado

- **WHEN** uma alteração aprovada alcança a branch de produção
- **THEN** o pipeline executa testes e validações antes do deploy e não registra valores de secrets

### Requirement: Processar webhooks com autenticação e idempotência

O sistema SHALL expor endpoint HTTPS para Evolution API, validar assinatura/token configurado quando suportado, responder rapidamente e processar eventos de forma idempotente em armazenamento persistente.

#### Scenario: Evolution reenvia um evento

- **WHEN** o mesmo evento chega mais de uma vez
- **THEN** o sistema persiste e processa apenas uma vez

### Requirement: Executar tarefas agendadas com confiabilidade

O sistema SHALL executar ações de cadência vencidas por agendador persistente. Se Vercel não garantir a frequência, duração ou concorrência necessárias, o sistema SHALL usar workflow n8n com autenticação e callbacks idempotentes para acionar apenas jobs persistidos e elegíveis.

#### Scenario: Tarefa de cadência vence

- **WHEN** uma etapa de cadência atinge seu horário elegível
- **THEN** o agendador aciona o job persistido uma única vez e registra o resultado
