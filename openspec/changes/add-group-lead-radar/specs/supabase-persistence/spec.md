# Supabase Persistence Specification
## ADDED Requirements

### Requirement: Persistir leads de grupo e cursores de varredura
O sistema SHALL persistir no Supabase os leads detectados em grupos (com deduplicação por identificador de mensagem) e um cursor por grupo com o timestamp da última mensagem já processada, usando a mesma chave de serviço backend-only já estabelecida para conversas.

#### Scenario: Lead detectado é persistido
- **WHEN** uma mensagem de grupo é classificada como lead
- **THEN** o sistema grava o lead no Supabase de forma que sobreviva a um restart do processo

#### Scenario: Tentativa de duplicar um lead já registrado
- **WHEN** a mesma mensagem (mesmo identificador) é processada novamente
- **THEN** o sistema não cria um segundo registro de lead
