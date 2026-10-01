# Proposal

## Why

O radar de leads hoje usa palavras-chave derivadas do perfil principal da empresa. Isso funciona para um único foco, mas não escala para novos nichos/produtos como IPTV legal, telecom, previdenciário ou energia solar sem editar código ou duplicar agentes.

O operador precisa configurar nichos pelo painel e gerar rapidamente palavras-chave, termos negativos, critérios de qualificação e mensagens iniciais com IA a partir de um tema/produto, mantendo o mesmo pipeline de radar e evitando automações incompatíveis com regras legais ou de plataforma.

## What Changes

- Adiciona configuração de nichos de radar em `SettingsStore`, incluindo nicho ativo, palavras-chave, palavras negativas, descrição/oferta, critérios de intenção, mensagem inicial e regra de compliance.
- Adiciona rotas no painel/API para gerar uma configuração sugerida por IA a partir de nicho, tema ou produto, sem persistir automaticamente.
- Adiciona área no painel para criar, editar, ativar e salvar nichos, com botão "Gerar com IA".
- Atualiza o radar para usar o nicho ativo no prefiltro e na classificação por IA.
- Aplica palavras negativas no prefiltro para descartar mensagens antes da IA.

## Non-Goals

- Não criar um segundo agente/processo separado para cada nicho.
- Não enviar mensagens automáticas a leads ou grupos.
- Não armazenar nem expor secrets no painel.
- Não automatizar venda, orientação ou facilitação de IPTV irregular/pirataria; nichos gerados devem incluir regra de compliance e focar ofertas legais quando o tema for sensível.

## Capabilities

### New Capabilities

- `radar-niches`: gerenciamento de nichos de rastreio, geração assistida por IA e seleção do nicho ativo para o radar.

### Modified Capabilities

- `configuration-management`: passa a persistir nichos de radar como configuração não secreta.
- `lead-radar`: passa a usar o nicho ativo para prefiltro, palavras negativas e prompt de classificação.

## Impact

- Sem novas variáveis obrigatórias de ambiente.
- Usa o cliente de IA já configurado (`OPENAI_API_KEY` ou `GEMINI_API_KEY`) para geração opcional de nichos.
- Configuração local continua em `data/dashboard-settings.json` quando Supabase não estiver configurado.
