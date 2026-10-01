# Design

## Data Model

Cada nicho recebe `scanEnabled`, booleano que indica se ele participa das varreduras. `activeNicheId` continua existindo apenas como conveniência de edição/seleção principal no painel.

Para compatibilidade com a tabela existente, o backend grava a origem do nicho no `message_id` e em `service_match` usando um prefixo estável. Ao listar leads, a API enriquece os registros com `niche_id` e `niche_name` calculados. Isso evita depender de novas colunas para entregar a interface local.

## AI Field Rewrite

Nova rota:

- `POST /api/settings/radar-niches/rewrite-field`
  - Entrada: `{ niche, field, instruction }`
  - Saída: `{ field, value }`

Campos de lista retornam array; campos textuais retornam string. A IA recebe o nicho completo como contexto e a instrução do operador, devendo alterar somente o campo solicitado.

## Scanning

`LeadRadar` carrega todos os nichos com `scanEnabled=true`. Se não houver nenhum, mantém fallback para o perfil principal.

Na varredura histórica:

- Busca mensagens do grupo uma vez.
- Para cada nicho habilitado, usa cursor lógico `groupId::nicheId`.
- Aplica palavras negativas e palavras-chave daquele nicho.
- Classifica candidatas em lote.
- Persiste leads usando `messageId::nicheId`, permitindo que uma mesma mensagem seja lead em nichos diferentes sem colidir.

No webhook em tempo real, a mesma mensagem é avaliada contra cada nicho habilitado.

## UI

- Formulário de nicho ganha toggle `Participar do scan`.
- Formulário ganha seletor de campo, instrução/prompt e botão para recriar somente aquele campo com IA.
- Radar de Leads ganha abas de nicho: todos, sem nicho/fallback, e cada nicho configurado. A aba filtra a lista sem esconder os filtros já existentes.
