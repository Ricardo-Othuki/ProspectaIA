# Design

## Context

Existem scripts de teste separados para agente, grupos e mensagens, mas alguns podem chamar Evolution API ou usar configuração real. O fluxo recente de monitoramento introduziu allowlist e modo sugestão, porém não há um executor único que prove essas garantias junto com descoberta, qualificação e campanha.

## Goals / Non-Goals

**Goals:**

- Criar executor determinístico sem dependência de rede ou secrets.
- Simular o caminho completo com fixtures estáveis e asserções explícitas.
- Produzir relatório legível e JSON para inspeção e regressão.
- Permitir execução por CLI e posterior gatilho seguro no painel.

**Non-Goals:**

- Testar a conectividade real com Evolution API, Gemini/OpenAI ou Google Calendar.
- Enviar mensagens ou criar eventos reais.
- Substituir testes unitários existentes.
- Usar uma IA autônoma que determine ou altere dados de produção durante o teste.

## Decisions

- Criar um módulo `flowSimulationRunner` que recebe adaptadores fake explicitamente; os provedores reais não serão importados no modo simulação.
- Usar fixtures JSON versionadas com dados fictícios brasileiros, IDs que não representam contatos reais e um cenário padrão seguro.
- Registrar eventos em memória durante a execução e escrever relatório em `output/simulations/`, ignorado pelo Git.
- Expor uma rota que apenas inicia o executor com cenário allowlisted e retorna o relatório; sem parâmetros livres de URLs, credenciais ou destinatários.
- Aplicar injeção de dependência somente nos componentes necessários para testar a lógica; quando refatoração for inviável, testar o contrato do componente com fake compatível.

## Risks / Trade-offs

- [Divergência entre fake e provedor] → Manter fixtures de payload Evolution baseadas no normalizador em produção e testar seus contratos.
- [Cobertura incompleta] → Incluir asserções obrigatórias para proibição de rede/envio e para todas as ramificações críticas da allowlist.
- [Relatórios acumulados] → Aplicar retenção limitada ou sobrescrever relatório por execução identificada.

## Migration Plan

1. Adicionar executor, fakes e fixtures sem alterar o caminho de produção.
2. Registrar script npm e testes de asserção.
3. Adicionar ponto de entrada do painel após validação do executor CLI.
4. Em rollback, remover o endpoint/ação visual; o módulo de simulação não altera dados de produção.
