# Configuration Management Specification

## MODIFIED Requirements

### Requirement: Provide a central configuration dashboard

The system SHALL provide a dashboard area in PT-BR where an operator can inspect and configure supported application functions: business profile, campaign defaults, AI generation defaults, WhatsApp monitoring, Evolution webhook setup, calendar readiness, runtime health, and onboarding progress.

#### Scenario: Operator opens configuration

- **WHEN** an operator navigates to the configuration dashboard area
- **THEN** the system shows current non-secret settings, validation state, integration readiness, and onboarding actions in PT-BR

#### Scenario: A setting is unavailable

- **WHEN** a configured integration is unavailable or incomplete
- **THEN** the system identifies the missing configuration category in PT-BR without returning secret values

## ADDED Requirements

### Requirement: Present operator-facing content in PT-BR

The system SHALL present user-visible navigation, forms, feedback, accessibility labels, empty states, loading states, validation feedback, and operator documentation in Brazilian Portuguese.

#### Scenario: Operator encounters a failed dashboard request

- **WHEN** a browser request fails
- **THEN** the dashboard presents a safe, actionable PT-BR error message
