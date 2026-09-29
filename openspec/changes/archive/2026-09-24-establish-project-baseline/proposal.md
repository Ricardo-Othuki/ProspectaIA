# Proposal

## Why

The project already contains multiple lead-generation, AI, WhatsApp, calendar, campaign, and export behaviors but has no capability-level specifications. Establishing a baseline makes future changes reviewable without confusing existing behavior with proposed behavior.

## What Changes

Document the current externally observable capabilities in `openspec/specs/` and link this brownfield baseline to the existing implementation areas. No runtime behavior, credentials, or personal contact data changes as part of this baseline.

## Capabilities

### New Capabilities

None. This change captures existing capabilities only.

### Modified Capabilities

None. Existing runtime requirements are being documented, not changed.

## Impact

- Adds baseline specifications for lead discovery, qualification, content generation, campaign management, WhatsApp integration, calendar integration, and output/export.
- Adds OpenSpec project context and validation guidance.
- Adds no application dependency or runtime code changes.
