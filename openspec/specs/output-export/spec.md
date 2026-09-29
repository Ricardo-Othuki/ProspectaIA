# Output and Export Specification

## Purpose

Persist campaign data and provide machine-readable and dashboard-consumable exports for leads, qualification results, messages, and progress.

## Requirements

### Requirement: Persist structured campaign artifacts

The system SHALL write campaign metadata, progress, lead results, and generated content to the configured output directory using stable file formats.

#### Scenario: Campaign completes successfully

- **WHEN** campaign processing finishes
- **THEN** output artifacts can be read by the CLI and web dashboard

### Requirement: Export lead data

The system SHALL support configured CSV, JSON, and vCard-style lead exports where those formats are enabled by the application.

#### Scenario: Caller requests a supported format

- **WHEN** export runs with a supported output format
- **THEN** the system creates a file in that format containing normalized lead fields

### Requirement: Preserve export safety

The system SHALL avoid writing API credentials, access tokens, or unrelated private configuration into lead and campaign exports.

#### Scenario: A lead record contains sensitive configuration fields

- **WHEN** export serializes the record
- **THEN** sensitive configuration is excluded from the exported artifact
