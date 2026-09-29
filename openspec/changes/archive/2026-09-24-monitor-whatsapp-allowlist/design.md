# Design

## Context

Evolution API can deliver webhook events with provider-specific payload shapes, while the current inbound route accepts a small phone/name/message contract. Monitoring must become explicitly opt-in before any AI processing. The current lead agent and WhatsApp integration can remain responsible for conversation generation and provider delivery, but authorization and event normalization need a boundary in front of them.

## Goals / Non-Goals

**Goals:**

- Make monitoring opt-in with an empty-by-default allowlist.
- Support both individual phone contacts and WhatsApp group IDs.
- Normalize common Evolution webhook payloads into one internal event shape.
- Make duplicate delivery harmless and self-authored events inert.
- Return suggestions without automatic sends.
- Provide safe management/status operations without exposing secrets or message bodies.

**Non-Goals:**

- Building a user authentication system beyond the existing local/admin route protection boundary.
- Automatically discovering or adding contacts/groups.
- Reading historical chats before a target is explicitly allowed.
- Sending unsolicited messages or enabling autonomous outbound replies.
- Replacing the existing LeadAgent conversation and calendar behavior.

## Decisions

- Store the allowlist in a local JSON data file so it works with the current single-instance Node.js deployment and is inspectable/back-up-able without adding a database migration.
- Represent phone targets in canonical digits-only form and group targets using the provider's stable `@g.us` identifier; compare case-insensitively for IDs.
- Normalize Evolution events at the webhook boundary, accepting common `messages.upsert` fields and the existing direct `{ phone, name, message, fromMe }` contract.
- Derive an event key from provider message ID when present, otherwise from target, timestamp, sender, and text; keep a bounded in-memory processed set for immediate retries and persist event receipts for process restarts.
- Keep `POST /inbound` suggestion-only. Add a separate explicit send operation that checks the allowlist again immediately before calling the provider.
- Use a configurable local admin token for management endpoints when configured; fail closed for management mutations if no token is configured.

## Risks / Trade-offs

- JSON persistence is appropriate for one local process but needs a database or locking strategy for multiple instances.
- Evolution API payloads vary by version, so normalization needs fixture tests and conservative rejection of unknown/malformed messages.
- A deterministic fallback event key can incorrectly collapse identical repeated messages; provider IDs should be preferred and fallback receipts should expire or remain bounded.
- Suggestion-only operation changes current auto-response expectations but is required to prevent unintended outbound communication.
