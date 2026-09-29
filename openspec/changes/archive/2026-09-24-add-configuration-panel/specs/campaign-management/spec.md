# Campaign Management Specification

## MODIFIED Requirements

### Requirement: Respect campaign configuration

The system SHALL honor configured industry, style, language, output format, result limits, lead score threshold, outreach settings, and persisted operator-defined campaign defaults. Explicit campaign request options SHALL override persisted defaults.

#### Scenario: Campaign uses custom options

- **WHEN** campaign options override defaults
- **THEN** processing uses those options without mutating unrelated global configuration

#### Scenario: Campaign uses persisted dashboard defaults

- **WHEN** a campaign omits an optional processing setting that has a valid persisted operator default
- **THEN** the system applies that persisted default
