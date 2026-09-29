# Supabase Persistence Specification

## ADDED Requirements

### Requirement: Persistir domínio comercial com isolamento

O sistema SHALL persistir contatos, consentimentos, campanhas, cadências, conversas, mensagens, sugestões, aprovações, eventos de auditoria e configurações comerciais no Supabase com migrations versionadas e políticas RLS.

#### Scenario: Operador autenticado consulta uma campanha

- **WHEN** um operador autenticado acessa uma campanha autorizada
- **THEN** o sistema retorna somente registros pertencentes ao escopo do operador/organização

#### Scenario: Cliente não autenticado acessa a API

- **WHEN** uma requisição sem credenciais válidas tenta acessar dados comerciais
- **THEN** o sistema rejeita a requisição e não expõe registros

### Requirement: Proteger credenciais de serviço

O sistema SHALL usar chave de serviço Supabase somente no backend/worker e SHALL usar chaves públicas apenas para operações autorizadas por RLS. Nenhuma chave privada SHALL ser exposta ao navegador, GitHub ou logs.

#### Scenario: Painel consulta dados comerciais

- **WHEN** o painel consulta dados do Supabase
- **THEN** a autenticação e as RLS determinam o escopo sem expor chave de serviço
