# WhatsApp Monitoring Specification

## ADDED Requirements

### Requirement: Validar controles de monitoramento em simulação

O sistema SHALL disponibilizar fixtures de simulação que validem o processamento de alvos permitidos, rejeição de alvos não permitidos, mensagens próprias, eventos duplicados e modo sugestão sem envio externo.

#### Scenario: Simulação recebe evento permitido

- **WHEN** o executor fornece um evento válido para alvo presente na allowlist de fixture
- **THEN** ele registra sugestão local e confirma que nenhuma mensagem externa foi enviada

#### Scenario: Simulação recebe evento não permitido

- **WHEN** o executor fornece um evento para alvo ausente da allowlist de fixture
- **THEN** ele confirma que o agente não foi invocado e que não houve efeito externo
