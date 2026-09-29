# Proposal

## Why

The application can receive WhatsApp messages, but monitoring is not yet constrained by an explicit user-managed allowlist of contacts and groups. This creates an unsafe boundary for privacy and could allow the agent to process or respond to conversations outside the user's intent.

## What Changes

Add an opt-in WhatsApp monitoring capability backed by a local allowlist of normalized phone numbers and group IDs. Evolution API webhook events will be validated, filtered before AI processing, deduplicated, and exposed through management endpoints. The agent will generate suggestions for allowed conversations while keeping sending disabled by default; outbound sending remains an explicit action.

## Capabilities

### New Capabilities

- `whatsapp-monitoring`: User-controlled allowlist, Evolution webhook ingestion, filtering, deduplication, conversation event storage, and suggestion-only processing.

### Modified Capabilities

- `whatsapp-integration`: Inbound handling must reject unallowed contacts/groups and distinguish suggestions from explicitly authorized sends.

## Impact

- Adds allowlist configuration and persistence under the project data directory.
- Adds Evolution webhook registration/status support without exposing API credentials.
- Extends inbound routes and agent integration with authorization, idempotency, and suggestion responses.
- Adds tests for phone/group normalization, filtering, duplicate events, self messages, malformed events, and send safety.
- Does not initiate monitoring for any contact or group unless explicitly added by the user.
