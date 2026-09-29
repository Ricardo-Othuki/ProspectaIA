# Content Generation Specification

## MODIFIED Requirements

### Requirement: Personalize outreach content

The system SHALL generate outreach content using lead details, business profile information, configured industry, campaign style, output language, and valid persisted generation defaults. Secret provider credentials SHALL remain environment-only.

#### Scenario: A lead has a known business name and category

- **WHEN** content generation runs for the lead
- **THEN** the message references available business context and the configured offering without exposing internal prompts

#### Scenario: Operator changes generation defaults

- **WHEN** an operator saves valid non-secret generation defaults in the dashboard
- **THEN** subsequent generation requests use those defaults unless explicitly overridden
