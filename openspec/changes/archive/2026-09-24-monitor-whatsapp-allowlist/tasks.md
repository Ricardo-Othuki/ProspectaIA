# Tasks

## 1. Monitoring configuration and authorization

- [x] 1.1 Add an allowlist store with empty-by-default phone/group collections and atomic JSON persistence.
- [x] 1.2 Add target normalization and validation for digits-only phones and Evolution group IDs.
- [x] 1.3 Add management/status routes with configurable admin-token protection and redacted responses.
- [x] 1.4 Add tests for add/list/remove, invalid targets, empty defaults, and authorization failures.

## 2. Evolution webhook boundary

- [x] 2.1 Add a normalized webhook event parser for direct inbound payloads and common Evolution `messages.upsert` payloads.
- [x] 2.2 Add self-message, malformed-event, unauthorized-target, and duplicate-event handling before agent invocation.
- [x] 2.3 Add bounded event receipt persistence/idempotency and safe structured logging without message secrets.
- [x] 2.4 Add webhook fixtures/tests covering phone contacts and group messages.

## 3. Suggestion and explicit sending flow

- [x] 3.1 Change authorized inbound processing to return a suggestion and conversation metadata with no automatic send.
- [x] 3.2 Add an explicit reviewed-send endpoint that rechecks allowlist authorization immediately before delivery.
- [x] 3.3 Preserve existing outbound prospecting behavior behind explicit calls and verify no credentials or message history leak in responses.
- [x] 3.4 Add tests proving inbound monitoring leaves `sent` false and explicit send targets only allowed conversations.

## 4. Evolution API operations and documentation

- [x] 4.1 Add provider status and webhook registration helpers without logging API keys.
- [x] 4.2 Document environment variables, management endpoints, allowlist examples, and suggestion-only safety behavior.
- [x] 4.3 Update `.env.example` with names only and safe defaults; never copy values from `.env`.

## 5. Verification

- [x] 5.1 Run targeted monitoring tests and the existing `npm test` suite.
- [x] 5.2 Run `npx openspec validate --all --strict`.
- [x] 5.3 Run available lint/typecheck commands or record that the scripts are unavailable.
- [x] 5.4 Review diff/status for accidental credentials or unrelated changes before archive.
