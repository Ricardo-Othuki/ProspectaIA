# Design

## Context

This is a brownfield Node.js application with existing CLI, web, external integration, AI, persistence, and export modules. OpenSpec is being introduced to organize the current product before further WhatsApp monitoring work is proposed.

## Goals / Non-Goals

**Goals:**

- Establish one baseline spec per coherent product capability.
- Keep requirements observable and scenario-driven.
- Preserve the current CommonJS modules, scripts, APIs, and environment-based configuration.
- Make security and external-service failure behavior explicit.

**Non-Goals:**

- Implement WhatsApp allowlists, webhook registration, or monitoring changes.
- Refactor runtime code.
- Change `.env` values or expose secrets.
- Claim that undocumented behavior is implemented merely because it is planned.

## Decisions

- Use capability paths that match the main runtime subsystems rather than individual source files.
- Keep baseline specs under `openspec/specs/`; reserve active changes for proposed deltas.
- Place Kilo OpenSpec skills under `.kilo/skills/` and commands under `.kilo/command/`.
- Treat credential handling and outbound communication as explicit safety requirements.

## Risks / Trade-offs

- Some legacy behavior is broader than the available test coverage; baseline requirements describe intended observable contracts and should be refined when future changes verify edge cases.
- The existing project contains mixed Portuguese and English user-facing text; specs use concise English while preserving the product's Portuguese behavior as implementation context.
