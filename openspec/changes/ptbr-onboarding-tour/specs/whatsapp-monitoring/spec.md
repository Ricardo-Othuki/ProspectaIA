# WhatsApp Monitoring Specification

## MODIFIED Requirements

### Requirement: Manage monitored contacts and groups

The system SHALL provide dashboard and API management operations to list, add, and remove normalized phone numbers and group IDs from the allowlist. All mutation operations SHALL require an explicit administrator token, and the dashboard SHALL retain the token only in active memory. Adding a target SHALL require explicit user action; receiving a message SHALL never add a target automatically. The dashboard SHALL explain this safety boundary in PT-BR during onboarding and configuration.

#### Scenario: User adds a phone number

- **WHEN** the user submits a valid phone number with a valid administrator token
- **THEN** the system stores its normalized form and reports the target as monitored

#### Scenario: User adds a group ID

- **WHEN** the user submits a valid Evolution group ID with a valid administrator token
- **THEN** the system stores the group ID and reports the target as monitored

#### Scenario: User removes a target

- **WHEN** the user removes a configured contact or group with a valid administrator token
- **THEN** subsequent events for that target are ignored

#### Scenario: Invalid target is submitted

- **WHEN** a user submits an empty, malformed, or unsupported target
- **THEN** the system rejects it with a validation error and does not modify the allowlist

#### Scenario: Operador adiciona um telefone permitido

- **WHEN** o operador fornece um token administrativo válido e um telefone válido
- **THEN** o sistema armazena o formato normalizado, confirma que o alvo será monitorado e informa que respostas automáticas permanecem desativadas

#### Scenario: Operador adiciona um grupo permitido

- **WHEN** o operador fornece um token administrativo válido e um ID de grupo Evolution válido
- **THEN** o sistema armazena o ID e confirma que somente esse grupo poderá ser processado
