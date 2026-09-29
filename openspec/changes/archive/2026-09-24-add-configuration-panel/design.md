# Design

## Context

The current Express dashboard already serves campaign, analytics, and conversation views, while configuration is split across `.env`, business profile JSON, user preferences, and manual monitoring API calls. The recently added WhatsApp monitoring routes already enforce an administrator token and persist the allowlist in a local JSON file.

## Goals / Non-Goals

**Goals:**

- Add a single dashboard configuration section using existing frontend conventions.
- Configure supported non-secret values through validated server APIs.
- Show integration readiness with masked secret state.
- Manage WhatsApp allowlist, status, webhook registration, and reviewed sends from the dashboard.
- Retain existing CLI and environment configuration behavior.

**Non-Goals:**

- Add a database, Supabase integration, user accounts, or multi-user roles.
- Store or edit API keys, tokens, passwords, or Google credential contents in the browser or application data files.
- Replace `.env` as the source of secrets.
- Enable automatic outbound WhatsApp replies.
- Change campaign execution logic beyond applying persisted defaults when the caller does not provide an override.

## Decisions

- Use a local JSON configuration store for non-secret settings, matching the existing single-instance deployment and monitoring allowlist design; no database is required for this change.
- Reuse `business-profile.json` through its established validation API for profile editing, and use a separate ignored local file for dashboard-managed runtime defaults.
- Add a configuration API under `/api/settings` for safe reads/writes, with field-level validation and explicit allowlisted fields.
- Keep secret-bearing values environment-only. Status APIs expose booleans such as `configured` and safe identifiers such as selected model or instance name, never values of credentials.
- Store the monitoring administrator token only in a dashboard instance variable. Include it in request headers only for token-protected monitoring actions and clear it on page reload.
- Create dashboard cards/tabs for General & Campaigns, AI, WhatsApp Monitoring, Calendar, and System Health.

## Risks / Trade-offs

- Local JSON is appropriate for one process but cannot safely coordinate simultaneous writes across multiple instances; moving to a database later will require a separate OpenSpec change and Supabase credentials.
- Browser-only token retention means an operator must enter the monitoring token after each reload, which improves secret safety at the cost of convenience.
- Environment changes still require deployment-level edits and service restart; the UI must clearly distinguish mutable dashboard settings from environment-only secrets.
