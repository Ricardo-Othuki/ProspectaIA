# Design

## Context

`src/leadRadar.js` já tem um pipeline eficiente: prefiltro local, classificação em lote por IA e persistência de leads. `src/settingsStore.js` já persiste configurações não secretas do painel com fallback local. Portanto, o menor desenho é adicionar nichos a `SettingsStore` e fazer o radar carregar o nicho ativo antes de montar o prefiltro e o prompt.

## Data Model

`settings.radar` recebe:

- `activeNicheId`: id do nicho selecionado.
- `niches`: lista de objetos `{ id, name, description, offer, keywords, negativeKeywords, qualificationSignals, complianceRules, initialMessageTemplate, active }`.

Os campos são não secretos. Listas são limitadas e sanitizadas para evitar payloads grandes ou valores inválidos.

## API

- `POST /api/settings/radar-niches/generate`
  - Entrada: `{ topic, product, audience }`
  - Saída: `{ niche }`
  - Não persiste automaticamente.
  - Requer IA configurada.

Persistência usa o `PUT /api/settings` existente, enviando `settings.radar`.

## AI Generation

O prompt pede JSON estrito com palavras-chave, negativas, sinais de qualificação, regras de compliance e mensagem inicial. Para temas sensíveis como IPTV, o prompt instrui a restringir a oferta a serviços legais/autorizados e incluir negativos ligados a pirataria, desbloqueio ou acesso irregular.

Falha de IA retorna erro claro sem alterar configurações existentes.

## Lead Radar Behavior

- Prefiltro inclui palavras-chave do nicho ativo quando existir.
- Palavras negativas do nicho descartam a mensagem antes da chamada de IA.
- Se não houver nicho ativo válido, o radar mantém o comportamento anterior usando perfil de negócio e palavras genéricas.
- Prompt de classificação inclui descrição/oferta, sinais de qualificação e regras de compliance do nicho.

## Rollback

Remover `settings.radar.niches` ou limpar `activeNicheId` faz o radar voltar ao comportamento anterior.
