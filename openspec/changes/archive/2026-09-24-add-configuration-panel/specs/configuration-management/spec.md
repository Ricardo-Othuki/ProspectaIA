# Configuration Management Specification

## ADDED Requirements

### Requirement: Provide a central configuration dashboard

The system SHALL provide a dashboard area where an operator can inspect and configure supported application functions: business profile, campaign defaults, AI generation defaults, WhatsApp monitoring, Evolution webhook setup, calendar readiness, and runtime health.

#### Scenario: Operator opens configuration

- **WHEN** an operator navigates to the configuration dashboard area
- **THEN** the system shows the current non-secret settings, validation state, and integration readiness for each supported area

#### Scenario: A setting is unavailable

- **WHEN** a configured integration is unavailable or incomplete
- **THEN** the system identifies the missing configuration category without returning secret values

### Requirement: Persist non-secret configuration safely

The system SHALL validate and persist operator-managed non-secret settings without overwriting, returning, or storing API keys, access tokens, passwords, or credential-file content in browser-visible configuration data.

#### Scenario: Operator saves valid campaign defaults

- **WHEN** the operator submits valid campaign default settings
- **THEN** the system persists those settings and makes them available to subsequent campaign operations

#### Scenario: Operator submits invalid settings

- **WHEN** the operator submits unsupported values or invalid field formats
- **THEN** the system rejects the update, identifies the affected fields, and preserves the last valid configuration

### Requirement: Surface secret configuration without exposing it

The system SHALL report whether required environment-based secrets and credential files are configured while masking their values and never returning their contents to the browser.

#### Scenario: Operator reviews AI configuration

- **WHEN** the dashboard loads AI provider settings
- **THEN** it displays the selected model and whether the API credential is configured, without returning the API key

#### Scenario: Operator reviews Evolution configuration

- **WHEN** the dashboard loads WhatsApp provider settings
- **THEN** it displays the provider, instance name when safe, connection state, and which required fields are missing, without returning the API key

### Requirement: Use explicit administrator authorization for monitoring actions

The system SHALL require an explicit administrator token for WhatsApp monitoring management, webhook registration, and reviewed sends. The dashboard SHALL keep this token only in active page memory and SHALL NOT persist it in browser storage or return it through APIs.

#### Scenario: Operator adds an allowed contact

- **WHEN** an operator provides a valid active administrator token and a valid phone or group ID
- **THEN** the system adds the target to the monitoring allowlist

#### Scenario: Operator has no valid administrator token

- **WHEN** the operator attempts a monitoring administration action without a valid token
- **THEN** the system rejects the action and does not change monitoring state

### Requirement: Preserve existing operator workflows

The system SHALL retain `.env`, CLI, and existing API configuration workflows while dashboard configuration manages only explicitly supported non-secret settings.

#### Scenario: Existing environment configuration is present

- **WHEN** the dashboard configuration feature is introduced to an existing deployment
- **THEN** existing environment-based integrations remain compatible and continue to load their secret values from the environment
