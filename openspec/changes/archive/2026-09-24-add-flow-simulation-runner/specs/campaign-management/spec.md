# Campaign Management Specification

## ADDED Requirements

### Requirement: Simular campanha com dados controlados

O sistema SHALL permitir que o fluxo de campanha seja exercitado com leads e respostas de provedores simulados, preservando configurações e resultados de produção.

#### Scenario: Campanha simulada processa leads de fixture

- **WHEN** o executor inicia cenário de campanha simulada
- **THEN** ele qualifica os leads fixture, gera conteúdo determinístico e registra resultados sem executar scraper ou entregas externas
