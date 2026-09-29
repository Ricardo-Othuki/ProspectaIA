# Sales Agent Specification
## ADDED Requirements

### Requirement: Manter humano no controle de cada envio
O sistema SHALL manter toda mensagem gerada pelo agente (primeiro contato ou resposta a um lead) como rascunho pendente associado à conversa, e SHALL NOT enviá-la pelo WhatsApp até uma decisão explícita do operador: aprovar, aprovar com edição, ou descartar.

#### Scenario: Agente gera a primeira mensagem
- **WHEN** o operador inicia uma prospecção para um lead
- **THEN** o sistema gera a mensagem e a mantém como rascunho pendente, com status `awaiting_approval`, sem chamar o provedor de WhatsApp

#### Scenario: Agente gera uma resposta de acompanhamento
- **WHEN** um lead responde e a conversa não está sob controle humano
- **THEN** o sistema gera a próxima resposta e a mantém como rascunho pendente, sem enviá-la automaticamente

#### Scenario: Operador aprova o rascunho
- **WHEN** o operador aprova o rascunho pendente, com ou sem edição do texto
- **THEN** o sistema envia o conteúdo aprovado (editado ou original) pelo WhatsApp, registra a mensagem no histórico da conversa e limpa o rascunho pendente

#### Scenario: Operador descarta o rascunho
- **WHEN** o operador descarta o rascunho pendente
- **THEN** o sistema remove o rascunho sem enviar nada e sem alterar o histórico de mensagens já enviadas

#### Scenario: Conversa sob controle humano
- **WHEN** o operador assumiu o controle da conversa (`humanControlled`)
- **THEN** o sistema não gera nem envia mensagens automáticas; apenas mensagens manuais explicitamente enviadas pelo operador são registradas

### Requirement: Permitir destino de envio de teste por conversa
O sistema SHALL permitir configurar, por conversa, um destino de envio de teste (`testTarget`, incluindo contatos de grupo do WhatsApp) diferente do número real do lead, para simular uma prospecção sem contatar o lead de fato.

#### Scenario: Conversa criada com destino de teste
- **WHEN** uma conversa é criada com um `testTarget` informado
- **THEN** toda aprovação de envio naquela conversa usa o `testTarget` como destinatário, em vez do telefone do lead
