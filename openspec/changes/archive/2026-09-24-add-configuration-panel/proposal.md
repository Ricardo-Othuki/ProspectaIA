# Proposal

## Why

Configuring the application currently requires editing `.env`, JSON files, and request headers manually. A central dashboard panel is needed so an operator can configure supported system functions safely, understand which integrations are ready, and manage WhatsApp monitoring without handling secrets in the browser.

## What Changes

- Add a dashboard configuration area for business profile, campaign defaults, AI provider settings, WhatsApp monitoring, Evolution webhook registration, calendar status, and runtime health.
- Add server-side configuration APIs that validate and persist non-secret settings.
- Provide a secure local administrator session/token entry for WhatsApp monitoring management without storing its value in browser persistence.
- Display integration readiness and masked configuration state; never return existing API keys, tokens, or credential file contents to the browser.
- Make generated setup commands and documentation actionable from the UI, while retaining existing CLI and `.env` configuration compatibility.

## Capabilities

### New Capabilities

- `configuration-management`: Dashboard-driven configuration of supported non-secret application settings, integration readiness, validation, and safe persistence.

### Modified Capabilities

- `whatsapp-monitoring`: Monitoring allowlist, provider status, webhook registration, and reviewed sends become accessible from the dashboard through an explicit administrator session.
- `campaign-management`: Operators can configure and persist default campaign processing options from the dashboard.
- `content-generation`: Operators can select supported AI model and generation defaults without exposing API credentials.

## Impact

- Adds a Settings/Configuration dashboard section and browser API client methods.
- Adds configuration persistence and validation routes on the Express server.
- Extends the monitoring API to support the existing token-protected operations through the dashboard session.
- May update environment variable examples and operator documentation; values in existing `.env` remain private and are never read back through APIs.
