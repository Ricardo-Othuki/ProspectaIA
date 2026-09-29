# WhatsApp Monitoring Specification

## MODIFIED Requirements

### Requirement: Manage monitored contacts and groups

The system SHALL provide dashboard and API management operations to list, add, and remove normalized phone numbers and group IDs from the allowlist. All mutation operations SHALL require an explicit administrator token, and the dashboard SHALL retain the token only in active memory. Adding a target SHALL require explicit user action; receiving a message SHALL never add a target automatically.

#### Scenario: User adds a phone number

- **WHEN** the user submits a valid phone number with a valid administrator token
- **THEN** the system stores its normalized form and reports the target as monitored

#### Scenario: User adds a group ID

- **WHEN** the user submits a valid Evolution group ID with a valid administrator token
- **THEN** the system stores the group ID and reports the target as monitored

#### Scenario: User removes a target

- **WHEN** the user removes a configured contact or group with a valid administrator token
- **THEN** subsequent events for that target are ignored

#### Scenario: Invalid target is submitted

- **WHEN** a user submits an empty, malformed, or unsupported target
- **THEN** the system rejects it with a validation error and does not modify the allowlist

### Requirement: Keep monitoring suggestion-only by default

The system SHALL return generated suggestions and conversation metadata separately from outbound delivery. It SHALL NOT send an automatic WhatsApp reply for a monitored event unless a caller explicitly requests sending through an authorized action.

#### Scenario: Agent generates a response suggestion

- **WHEN** an allowed inbound message is processed successfully
- **THEN** the result contains a suggestion and conversation context, with `sent` false

#### Scenario: Explicit send is requested

- **WHEN** an authorized caller explicitly requests delivery of a reviewed suggestion
- **THEN** the system sends only to the corresponding allowed target and reports the provider result

#### Scenario: Dashboard registers a webhook

- **WHEN** an operator submits a valid webhook URL with a valid administrator token
- **THEN** the system registers the webhook with Evolution API and returns the registration result without exposing credentials
