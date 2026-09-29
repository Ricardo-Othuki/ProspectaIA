# Sales Agent Specification

## ADDED Requirements

### Requirement: Operar contatos com autorização verificável

O sistema SHALL iniciar ou responder interações comerciais apenas para contatos com origem, base legal/consentimento e estado de elegibilidade registrados. Contatos com opt-out, bloqueio, campanha pausada ou intervenção humana SHALL NOT receber mensagens automatizadas.

#### Scenario: Contato elegível entra em uma campanha ativa

- **WHEN** um contato autorizado atende aos critérios de uma campanha ativa dentro da janela de envio
- **THEN** o agente pode gerar uma mensagem de acordo com a cadência e as regras de aprovação da campanha

#### Scenario: Contato solicita parada

- **WHEN** uma resposta é identificada como opt-out ou bloqueio
- **THEN** o sistema registra a decisão, interrompe mensagens futuras e informa o estado ao operador

### Requirement: Executar cadência comercial com limites

O sistema SHALL executar cadências por campanha com etapas, intervalo mínimo, horários permitidos, limite diário, limite por contato, retries seguros e pausa manual.

#### Scenario: Próxima etapa está elegível

- **WHEN** a próxima etapa de cadência vence dentro de uma janela válida e os limites não foram atingidos
- **THEN** o sistema cria uma ação de mensagem para aprovação ou envio conforme a política configurada

#### Scenario: Limite de volume é atingido

- **WHEN** a campanha atinge o limite diário ou a conta atinge um limite de segurança
- **THEN** o sistema pausa novas ações até a próxima janela elegível e registra o motivo

### Requirement: Manter humano no controle

O sistema SHALL suportar políticas por campanha de `somente_sugestao`, `aprovar_antes_de_enviar` e `envio_automatico_controlado`. O padrão SHALL ser `aprovar_antes_de_enviar`.

#### Scenario: Política exige aprovação

- **WHEN** o agente gera uma mensagem para campanha configurada para aprovação
- **THEN** a mensagem fica pendente e não é enviada até uma aprovação explícita do operador

#### Scenario: Operador assume conversa

- **WHEN** o operador ativa intervenção humana em uma conversa
- **THEN** o agente interrompe mensagens e ações automáticas para o contato até liberação explícita

### Requirement: Registrar decisões e auditoria

O sistema SHALL persistir eventos de importação, elegibilidade, mensagens, sugestões, aprovações, envios, falhas, opt-outs, mudanças de funil e intervenções humanas com timestamps e origem.

#### Scenario: Mensagem é enviada

- **WHEN** um envio é confirmado pelo provedor
- **THEN** o sistema registra a mensagem, o resultado do provedor e a transição de cadência correspondente
