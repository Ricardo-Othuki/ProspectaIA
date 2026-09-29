# Simulação de Fluxo Specification

## ADDED Requirements

### Requirement: Executar cenário ponta a ponta sem efeitos externos

O sistema SHALL executar cenários de fluxo com adaptadores simulados para scraper, IA, WhatsApp/Evolution e calendário. Durante a simulação, SHALL NOT emitir requisições externas, enviar mensagens, criar eventos de calendário reais ou ler valores de secrets.

#### Scenario: Operador inicia uma simulação padrão

- **WHEN** o operador executa o cenário padrão pelo comando ou painel
- **THEN** o sistema processa fixtures de perfil, leads, campanha e conversas inteiramente em modo local

#### Scenario: Provedor externo seria acionado

- **WHEN** uma etapa tenta usar WhatsApp, IA, calendário ou scraper
- **THEN** o adaptador simulado registra a intenção no relatório sem contatar o provedor externo

### Requirement: Cobrir decisões críticas do fluxo real

O sistema SHALL incluir no cenário padrão descoberta de leads, qualificação, geração de conteúdo, campanha, allowlist WhatsApp, evento permitido, evento não permitido, mensagem própria, duplicação de evento, sugestão e tentativa de envio revisado.

#### Scenario: Evento de contato permitido

- **WHEN** uma fixture representa uma mensagem de contato explicitamente permitido
- **THEN** o relatório registra uma sugestão com `sent` falso

#### Scenario: Evento não permitido ou duplicado

- **WHEN** uma fixture representa alvo ausente da allowlist ou evento repetido
- **THEN** o relatório registra que o evento foi ignorado antes do agente

### Requirement: Produzir relatório auditável

O sistema SHALL produzir resumo humano em PT-BR e artefato JSON contendo cenário, etapas, resultados, avisos, falhas, duração e confirmação de ausência de efeitos externos.

#### Scenario: Simulação termina

- **WHEN** todas as etapas são executadas
- **THEN** o relatório identifica sucesso ou falha de cada asserção e o caminho do artefato JSON

### Requirement: Permitir reprodução por fixtures

O sistema SHALL carregar cenários de fixtures versionadas e permitir escolher um cenário pelo identificador, sem modificar dados persistidos de produção.

#### Scenario: Operador seleciona cenário específico

- **WHEN** o operador informa um identificador de cenário válido
- **THEN** o executor usa as fixtures correspondentes e mantém os dados de produção inalterados
