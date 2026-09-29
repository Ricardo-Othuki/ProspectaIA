# Content Generation Specification

## Purpose

Generate localized, industry-aware marketing content and personalized outreach messages from the business profile and qualified lead data.

## Requirements

### Requirement: Personalize outreach content

The system SHALL generate outreach content using lead details, business profile information, configured industry, campaign style, output language, and valid persisted generation defaults. Secret provider credentials SHALL remain environment-only.

#### Scenario: A lead has a known business name and category

- **WHEN** content generation runs for the lead
- **THEN** the message references available business context and the configured offering without exposing internal prompts

#### Scenario: Operator changes generation defaults

- **WHEN** an operator saves valid non-secret generation defaults in the dashboard
- **THEN** subsequent generation requests use those defaults unless explicitly overridden

### Requirement: Support campaign content formats

The system SHALL support configured output formats and campaign content such as WhatsApp messages, email subjects and bodies, social posts, and multi-touch sequences where enabled.

#### Scenario: Multi-touch generation is disabled

- **WHEN** the campaign requests content with multi-touch disabled
- **THEN** the system generates only the primary configured content rather than extra follow-up messages

### Requirement: Provide safe fallback content

The system SHALL return useful template-based content when the AI provider is unavailable, unconfigured, or returns invalid output.

#### Scenario: AI generation fails

- **WHEN** the configured AI client raises an error
- **THEN** the system returns a deterministic fallback message and preserves lead processing
