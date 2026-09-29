# Serverless Compatibility Specification
## ADDED Requirements

### Requirement: Operar sem processo contínuo
O sistema SHALL funcionar corretamente quando executado como função serverless (sem processo de longa duração), sem depender de temporizadores em memória (`setInterval`) nem de conexões mantidas abertas indefinidamente para operar suas funções essenciais (aprovação de mensagens, radar de leads, alertas).

#### Scenario: Execução serverless
- **WHEN** o sistema roda como função serverless (variável de ambiente `VERCEL` presente)
- **THEN** os pollers locais (`setInterval`, long polling do Telegram) não são iniciados, e as rotas de webhook/cron assumem as mesmas funções

#### Scenario: Execução local
- **WHEN** o sistema roda localmente como processo contínuo (`npm run web`, sem `VERCEL`)
- **THEN** o comportamento observável é idêntico ao anterior a este change (pollers ativos, SSE funcionando)

### Requirement: Persistir estado operacional em armazenamento compartilhado
O sistema SHALL persistir configurações, grupos excluídos do radar e correlações de alerta em um armazenamento acessível a qualquer invocação (Supabase), e SHALL NOT depender de arquivos locais graváveis para esse estado.

#### Scenario: Duas invocações diferentes leem a mesma configuração
- **WHEN** uma invocação grava uma configuração e outra invocação, posterior e independente, a lê
- **THEN** o valor lido reflete a gravação, sem depender de as duas invocações compartilharem processo ou disco

### Requirement: Atualizar o painel sem conexão persistente
O sistema SHALL disponibilizar atualizações em tempo quase real do painel através de um mecanismo que não exija uma conexão mantida aberta entre cliente e servidor (ex.: consulta periódica a um log de eventos persistido).

#### Scenario: Evento gerado em uma invocação, lido em outra
- **WHEN** uma notificação é gerada durante o processamento de uma requisição
- **THEN** uma consulta subsequente e independente do painel consegue recuperar essa notificação
