# Lead Radar Specification
## ADDED Requirements

### Requirement: Detectar pedidos de serviço em grupos monitorados
O sistema SHALL varrer mensagens de grupos de WhatsApp não excluídos, restritas aos últimos 7 dias, e SHALL aplicar um prefiltro local por palavras-chave (derivado do perfil de negócio) antes de qualquer chamada a um modelo de IA, descartando mensagens que não batem com nenhum termo de serviço sem custo de IA.

#### Scenario: Mensagem sem relação com os serviços
- **WHEN** uma mensagem de grupo não contém nenhuma palavra-chave de serviço configurada
- **THEN** o sistema descarta a mensagem sem chamar nenhum modelo de IA

#### Scenario: Mensagem candidata
- **WHEN** uma mensagem de grupo contém ao menos uma palavra-chave de serviço
- **THEN** o sistema envia a mensagem para classificação por IA, em lote com outras candidatas da mesma varredura

### Requirement: Classificar e priorizar com custo mínimo
O sistema SHALL classificar mensagens candidatas usando um modelo de IA dedicado e mais barato que o do agente de vendas, em lote, retornando prioridade (alta/média/baixa), resumo da necessidade e motivo da relevância; mensagens não identificadas como pedido real SHALL NOT virar um lead.

#### Scenario: Classificação identifica um pedido real
- **WHEN** a IA classifica uma mensagem candidata como um pedido real de um serviço oferecido
- **THEN** o sistema persiste um lead com prioridade, resumo e motivo, associado à mensagem de origem

#### Scenario: Classificação descarta falso positivo
- **WHEN** a IA classifica uma mensagem candidata como não sendo um pedido real
- **THEN** o sistema não cria um lead para essa mensagem

### Requirement: Evitar reprocessamento e duplicação
O sistema SHALL manter um cursor por grupo com o timestamp da última mensagem processada, e SHALL usar o identificador de mensagem como chave única para nunca duplicar um lead nem reenviar o alerta correspondente.

#### Scenario: Nova varredura sobre o mesmo período
- **WHEN** uma varredura processa novamente mensagens já cobertas pelo cursor de um grupo
- **THEN** o sistema não reclassifica essas mensagens nem gera leads ou alertas duplicados

### Requirement: Listar leads com filtros
O sistema SHALL expor os leads detectados filtráveis por período (até 7 dias), prioridade e grupo, com ações para marcar como contatado ou dispensado.

#### Scenario: Operador filtra por prioridade alta nas últimas 24h
- **WHEN** o operador filtra a lista por prioridade alta e período de 24 horas
- **THEN** o sistema retorna somente os leads detectados nesse período com prioridade alta

### Requirement: Alertar em tempo real quando possível
O sistema SHALL enviar um alerta (WhatsApp e/ou Telegram, conforme configurado) com o resumo da necessidade e a prioridade assim que um lead de prioridade alta ou média for detectado, seja via mensagem recebida em tempo real (webhook) ou via varredura periódica.

#### Scenario: Lead de alta prioridade detectado em tempo real
- **WHEN** uma mensagem recebida ao vivo em um grupo monitorado é classificada como lead de prioridade alta
- **THEN** o sistema envia o alerta configurado imediatamente após a classificação

#### Scenario: Nenhum canal de alerta configurado
- **WHEN** nenhum canal de alerta (WhatsApp do dono ou Telegram) está configurado
- **THEN** o sistema ainda persiste o lead normalmente, apenas sem enviar notificação
