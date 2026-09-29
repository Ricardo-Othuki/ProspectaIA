# Campaign Management Specification

## Purpose

Orchestrate lead processing, content generation, exports, and optional outreach as a repeatable campaign with progress and result artifacts.

## Requirements

### Requirement: Execute a campaign from qualified leads

The system SHALL process a campaign's lead collection, apply qualification and content generation, and persist campaign outputs under the configured output directory.

#### Scenario: Campaign runs with eligible leads

- **WHEN** a campaign is started with valid leads and configuration
- **THEN** it processes leads, records progress, and creates campaign result files

### Requirement: Respect campaign configuration

The system SHALL honor configured industry, style, language, output format, result limits, lead score threshold, outreach settings, and persisted operator-defined campaign defaults. Explicit campaign request options SHALL override persisted defaults.

#### Scenario: Campaign uses custom options

- **WHEN** campaign options override defaults
- **THEN** processing uses those options without mutating unrelated global configuration

#### Scenario: Campaign uses persisted dashboard defaults

- **WHEN** a campaign omits an optional processing setting that has a valid persisted operator default
- **THEN** the system applies that persisted default

### Requirement: Report campaign failures

The system SHALL isolate per-lead failures where possible and record errors in progress or result artifacts instead of silently discarding them.

#### Scenario: One lead fails during processing

- **WHEN** a single lead cannot be processed
- **THEN** the campaign records the failure and continues with remaining leads when safe

### Requirement: Simular campanha com dados controlados

O sistema SHALL permitir que o fluxo de campanha seja exercitado com leads e respostas de provedores simulados, preservando configurações e resultados de produção.

#### Scenario: Campanha simulada processa leads de fixture

- **WHEN** o executor inicia cenário de campanha simulada
- **THEN** ele qualifica os leads fixture, gera conteúdo determinístico e registra resultados sem executar scraper ou entregas externas
