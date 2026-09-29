# WhatsApp Monitoring Specification

## ADDED Requirements

### Requirement: Monitor only explicitly allowed targets

The system SHALL process WhatsApp events only when the conversation target is explicitly present in the user-managed allowlist as a normalized phone number or group ID. The default allowlist SHALL be empty and monitoring SHALL be opt-in.

#### Scenario: Allowed contact sends a message

- **WHEN** a valid inbound event identifies a phone number present in the allowlist
- **THEN** the system accepts the event for processing and returns a suggestion result without sending a message automatically

#### Scenario: Unallowed contact sends a message

- **WHEN** a valid inbound event identifies a phone number absent from the allowlist
- **THEN** the system ignores the event, records the reason as unauthorized, and does not invoke the AI agent

#### Scenario: Allowed group sends a message

- **WHEN** a valid inbound event identifies a group ID present in the allowlist
- **THEN** the system accepts the event for processing under that group conversation

#### Scenario: Allowlist is empty

- **WHEN** any inbound WhatsApp event arrives while no targets are configured
- **THEN** the system ignores the event and performs no AI processing or outbound send

### Requirement: Manage monitored contacts and groups

The system SHALL provide authenticated management operations to list, add, and remove normalized phone numbers and group IDs from the allowlist. Adding a target SHALL require explicit user action; receiving a message SHALL never add a target automatically.

#### Scenario: User adds a phone number

- **WHEN** the user submits a valid phone number to the allowlist management operation
- **THEN** the system stores its normalized form and reports the target as monitored

#### Scenario: User adds a group ID

- **WHEN** the user submits a valid Evolution group ID
- **THEN** the system stores the group ID and reports the target as monitored

#### Scenario: User removes a target

- **WHEN** the user removes a configured contact or group
- **THEN** subsequent events for that target are ignored

#### Scenario: Invalid target is submitted

- **WHEN** a user submits an empty, malformed, or unsupported target
- **THEN** the system rejects it with a validation error and does not modify the allowlist

### Requirement: Validate and deduplicate Evolution events

The system SHALL validate inbound webhook payloads, ignore self-authored messages, and process each provider event at most once using a stable event identifier or deterministic fallback identity.

#### Scenario: Self-authored message arrives

- **WHEN** an event is marked as sent by the connected account
- **THEN** the system acknowledges it as ignored without AI processing or reply generation

#### Scenario: Duplicate event arrives

- **WHEN** the same provider event is delivered more than once
- **THEN** only the first delivery is processed and later deliveries are acknowledged as duplicates

#### Scenario: Malformed event arrives

- **WHEN** a webhook lacks a target, event identity, or text content
- **THEN** the system rejects or ignores it safely without invoking the AI agent

### Requirement: Keep monitoring suggestion-only by default

The system SHALL return generated suggestions and conversation metadata separately from outbound delivery. It SHALL NOT send an automatic WhatsApp reply for a monitored event unless a caller explicitly requests sending through an authorized action.

#### Scenario: Agent generates a response suggestion

- **WHEN** an allowed inbound message is processed successfully
- **THEN** the result contains a suggestion and conversation context, with `sent` false

#### Scenario: Explicit send is requested

- **WHEN** an authorized caller explicitly requests delivery of a reviewed suggestion
- **THEN** the system sends only to the corresponding allowed target and reports the provider result

### Requirement: Protect credentials and message data

The system SHALL load Evolution API credentials from environment configuration, redact secrets from logs and API responses, and avoid exposing full message history through allowlist management responses.

#### Scenario: Monitoring status is requested

- **WHEN** a caller requests monitoring status
- **THEN** the response includes enabled targets and provider connectivity state without API keys or message bodies
