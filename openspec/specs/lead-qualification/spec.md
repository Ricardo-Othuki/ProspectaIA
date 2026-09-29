# Lead Qualification Specification

## Purpose

Evaluate discovered business leads against the configured business profile to prioritize prospects suited to the offered services.

## Requirements

### Requirement: Score lead quality

The system SHALL calculate a bounded quality score from business information such as rating, review volume, website availability, category relevance, contact availability, and configured industry fit.

#### Scenario: Lead has strong business signals

- **WHEN** a lead includes several favorable qualification signals
- **THEN** the system assigns a higher score and explanatory qualification reasons

#### Scenario: Lead is missing optional business signals

- **WHEN** a lead lacks rating, website, phone, or category information
- **THEN** scoring completes using the remaining signals without failing

### Requirement: Produce actionable qualification fields

The system SHALL enrich each evaluated lead with score, quality tier, recommended approach, priority level, conversion potential, suggested action, and business profile context.

#### Scenario: A qualified lead is enriched

- **WHEN** lead analysis completes
- **THEN** the resulting record contains the original lead data plus qualification fields suitable for campaign use

### Requirement: Filter and rank qualified leads

The system SHALL return leads meeting the configured minimum score, ordered from highest score to lowest score.

#### Scenario: Some leads are below the threshold

- **WHEN** a lead's score is below the configured minimum
- **THEN** it is excluded from the qualified result list
