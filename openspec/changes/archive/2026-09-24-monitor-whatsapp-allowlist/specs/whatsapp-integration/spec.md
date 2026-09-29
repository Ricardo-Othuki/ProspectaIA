# WhatsApp Integration Specification

## MODIFIED Requirements

### Requirement: Receive inbound agent messages

The system SHALL accept normalized inbound message events through the agent API, ignore messages sent by the connected account, reject targets not explicitly present in the monitoring allowlist, and route only authorized valid messages to conversation processing.

#### Scenario: Valid inbound message arrives

- **WHEN** an inbound event includes a phone and message and is not from the connected account
- **THEN** the system creates or resumes the conversation and returns a suggestion result without automatic delivery

#### Scenario: Valid allowed inbound message arrives

- **WHEN** an inbound event includes a phone or group target, text content, is not from the connected account, and the target is allowed
- **THEN** the system creates or resumes the conversation and returns a suggestion result without automatic delivery

#### Scenario: Valid unallowed inbound message arrives

- **WHEN** an inbound event identifies a target absent from the monitoring allowlist
- **THEN** the system acknowledges the event as ignored and does not invoke the conversation agent

#### Scenario: Self-sent or malformed event arrives

- **WHEN** the event is marked `fromMe` or lacks a target or text content
- **THEN** the system ignores it or returns a validation error without generating or sending a reply
