# Proposal

## Why

O painel ainda mistura textos em inglês e não conduz o operador desde a primeira abertura até um ambiente configurado. Isso dificulta o entendimento do fluxo, a configuração inicial do negócio e o povoamento seguro com perfil, preferências, contatos/grupos autorizados e primeira campanha.

## What Changes

- Traduzir toda a interface web, mensagens de erro/sucesso, navegação, estados vazios, labels, placeholders, acessibilidade e documentação operacional para PT-BR.
- Adicionar um onboarding guiado de primeiro acesso, com progresso, retomada e opção de revisar etapas concluídas.
- Guiar o operador pela configuração do perfil do negócio, preferências de campanha/IA, integração Evolution/WhatsApp, allowlist, calendário e primeira campanha.
- Adicionar validação de prontidão por etapa e impedir que o onboarding marque uma etapa como concluída sem dados mínimos válidos.
- Exibir uma explicação contextual do funcionamento: descoberta, qualificação, geração de conteúdo, monitoramento permitido, sugestões e envio explícito.
- Permitir concluir o onboarding sem cadastrar secrets no navegador; secrets permanecem no `.env`.

## Capabilities

### New Capabilities

- `onboarding-tour`: Primeiro acesso guiado, checklist de prontidão, retomada e povoamento inicial seguro.

### Modified Capabilities

- `configuration-management`: A configuração passa a ser guiada por etapas e apresentada integralmente em PT-BR.
- `whatsapp-monitoring`: O onboarding orienta o cadastro explícito de contatos/grupos e reforça o modo sugestão sem envio automático.
- `campaign-management`: O onboarding cria e valida defaults antes da primeira campanha.
- `content-generation`: O idioma PT-BR passa a ser o padrão visível e selecionável para geração.

## Impact

- Atualiza textos da interface, documentação e mensagens apresentadas ao operador.
- Adiciona estado persistente local de onboarding, sem banco ou Supabase.
- Adiciona endpoints de progresso e validação de prontidão.
- Adiciona uma experiência de primeiro acesso sem alterar o limite de segurança que mantém credenciais fora do navegador.
