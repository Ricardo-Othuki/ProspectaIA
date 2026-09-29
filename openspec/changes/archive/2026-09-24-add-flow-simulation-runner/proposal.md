# Proposal

## Why

Os testes atuais são scripts avulsos, alguns orientados a envio real, e não fornecem uma simulação segura, repetível e auditável do fluxo completo. É necessário validar o comportamento realista do sistema sem disparar mensagens, depender de credenciais externas ou contaminar dados de produção.

## What Changes

- Criar um simulador determinístico de fluxo ponta a ponta executado por CLI e opcionalmente pelo painel.
- Simular: perfil/configuração, descoberta de leads por fixtures, qualificação, conteúdo, campanha, allowlist WhatsApp, evento Evolution permitido/não permitido/duplicado, sugestão e envio revisado bloqueado por padrão.
- Injetar adaptadores fake para IA, WhatsApp/Evolution, calendário e scraper; nenhum request externo ou envio real será permitido no modo simulação.
- Gerar relatório JSON e resumo em PT-BR, com etapas, decisões, resultados, alertas e falhas verificáveis.
- Definir cenários predefinidos e permitir fixtures versionadas para reproduzir bugs.

## Capabilities

### New Capabilities

- `flow-simulation`: Executor seguro e repetível de cenários ponta a ponta com fixtures, adaptadores simulados e relatório auditável.

### Modified Capabilities

- `campaign-management`: A campanha passa a poder ser exercitada em modo simulação com dados controlados.
- `whatsapp-monitoring`: Eventos simulados devem provar allowlist, deduplicação, sugestão sem envio e bloqueio de ações não autorizadas.
- `configuration-management`: O painel poderá iniciar e consultar uma execução de simulação sem expor secrets.

## Impact

- Adiciona comando de teste de fluxo e fixtures isoladas.
- Adiciona relatório de execução em diretório ignorado pelo Git.
- Requer refatoração leve para injeção de dependências nos serviços testados, preservando os provedores reais como padrão.
- Não envia mensagens, não chama Evolution API, não chama IA externa, não executa scraping real e não usa secrets durante a simulação.
