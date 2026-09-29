# Tasks

## 1. Safe configuration backend

- [x] 1.1 Add a local non-secret settings store with atomic persistence and safe defaults.
- [x] 1.2 Define validated, allowlisted settings for campaign defaults, generation preferences, and dashboard behavior.
- [x] 1.3 Add `/api/settings` read/update endpoints that redact secrets and preserve existing `.env` behavior.
- [x] 1.4 Add integration readiness endpoints for AI, Evolution, Calendar, and system health without revealing secrets.
- [x] 1.5 Add backend tests for persistence, validation failures, redaction, and environment compatibility.

## 2. WhatsApp dashboard controls

- [x] 2.1 Add dashboard API methods for monitoring status, targets, webhook registration, and reviewed send requests.
- [x] 2.2 Add in-memory administrator-token handling; prohibit localStorage/sessionStorage persistence.
- [x] 2.3 Build allowlist contact/group add, remove, and list controls with validation and clear authorization feedback.
- [x] 2.4 Build provider status, webhook registration, and suggestion/reviewed-send controls that preserve suggestion-only defaults.
- [x] 2.5 Add frontend tests or browser-verifiable coverage for authorized and unauthorized monitoring actions.

## 3. Configuration dashboard experience

- [x] 3.1 Add a configuration navigation item and responsive dashboard section consistent with existing UI patterns.
- [x] 3.2 Build forms for business profile, campaign defaults, AI generation preferences, integrations, and system health.
- [x] 3.3 Show masked configuration state, validation messages, save status, and environment-only configuration guidance.
- [x] 3.4 Ensure all displayed operator content is safely escaped and no secret input is rendered back after submission.

## 4. Documentation and verification

- [x] 4.1 Update operator documentation for the dashboard configuration flow and boundary between UI settings and `.env` secrets.
- [x] 4.2 Run targeted configuration/monitoring tests and the existing `npm test` suite.
- [x] 4.3 Run `npx openspec validate --all --strict`.
- [x] 4.4 Run available lint/typecheck commands or record that scripts are unavailable.
- [x] 4.5 Review diff/status for credentials and unrelated changes before archive.
