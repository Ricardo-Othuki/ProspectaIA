# Supabase Persistence Specification
## ADDED Requirements

### Requirement: Persistir conversas e mensagens
O sistema SHALL persistir conversas de prospecção e suas mensagens (enviadas e recebidas) no Supabase, de forma que o histórico sobreviva a um restart do processo do servidor.

#### Scenario: Servidor reinicia
- **WHEN** o processo do servidor é reiniciado
- **THEN** as conversas e mensagens existentes continuam disponíveis pelas mesmas rotas de API, sem perda de dados

### Requirement: Proteger a chave de serviço do Supabase
O sistema SHALL usar a chave de serviço (`service_role`) do Supabase somente no processo backend, lida de variável de ambiente, e SHALL NOT expô-la ao navegador, a logs ou a respostas de API.

#### Scenario: Painel consulta uma conversa
- **WHEN** o dashboard busca dados de uma conversa via API
- **THEN** a resposta não contém a chave de serviço nem detalhes de conexão do Supabase
