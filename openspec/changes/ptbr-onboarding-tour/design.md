# Design

## Context

O painel é servido por Express com HTML, CSS e JavaScript sem framework. Configurações não secretas já usam JSON local; secrets são carregados do `.env`. A interface e algumas mensagens de API ainda têm conteúdo em inglês. Não existe estado de primeiro acesso nem mecanismo para guiar o operador no preenchimento do sistema.

## Goals / Non-Goals

**Goals:**

- Padronizar todo conteúdo visível ao operador em PT-BR.
- Criar onboarding modal, acessível e retomável sem dependências novas.
- Persistir estado local de progresso e checklist sem armazenar secrets.
- Reaproveitar APIs de configurações e monitoramento existentes, mantendo validação no servidor.

**Non-Goals:**

- Traduzir nomes técnicos internos, rotas HTTP, campos de código ou formatos de dados.
- Criar autenticação de usuários, multiempresa ou sincronização entre dispositivos.
- Adicionar Supabase ou outro banco de dados.
- Aceitar, salvar ou exibir secrets no navegador.
- Habilitar respostas automáticas no WhatsApp.

## Decisions

- Adicionar `onboardingStore` local com gravação atômica, seguindo o padrão do `settingsStore`; isso é suficiente para a implantação de instância única atual.
- Servir um endpoint de estado/readiness que combina progresso, perfil, settings e estado seguro das integrações.
- Usar modal de etapas com foco gerenciado, indicadores de progresso e botões de continuar, voltar, pular e reiniciar; o fechamento nunca marca conclusão.
- Definir PT-BR explicitamente em `lang="pt-BR"` e substituir literais visíveis de HTML, JavaScript e respostas API aplicáveis.
- Ligar cada etapa aos dados já existentes: perfil e settings são salvos pelas APIs; estado Evolution/IA/Calendar é apenas consultado; a allowlist requer token administrativo em memória.

## Risks / Trade-offs

- [Cobertura de textos] → Centralizar novos textos do onboarding e revisar todos os literais visíveis com busca estática antes da validação.
- [Interrupção do usuário] → Salvar progresso por etapa e disponibilizar retomar/reiniciar.
- [Instâncias múltiplas] → JSON local não sincroniza processos; uma futura migração para Supabase exigirá mudança OpenSpec separada e credenciais fornecidas pelo operador.
- [Segredos] → Exibir somente flags de prontidão e guias de `.env`, sem campos de entrada para secrets.

## Migration Plan

1. Implantar os endpoints de estado do onboarding e as traduções.
2. Ao primeiro carregamento, criar estado pendente sem sobrescrever perfil/settings existentes.
3. Permitir que operadores existentes fechem, concluam ou reiniciem o tour sem impacto em campanhas.
4. Para rollback, remover a referência do frontend e manter os dados locais inertes; configurações existentes continuam compatíveis.
