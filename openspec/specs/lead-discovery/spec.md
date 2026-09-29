# Lead Discovery Specification

## Purpose

Discover local business leads from Google Maps searches and normalize their publicly visible business details for qualification and outreach workflows.

## Requirements

### Requirement: Search businesses by geographic query

The system SHALL search Google Maps using a caller-supplied query, location, and optional result limit, returning only businesses with a non-empty name.

#### Scenario: Search returns matching businesses

- **WHEN** a caller requests a search with a query and location
- **THEN** the system returns normalized lead records up to the requested limit

#### Scenario: No matching businesses are available

- **WHEN** Google Maps produces no eligible business records
- **THEN** the system returns an empty result set without creating malformed leads

### Requirement: Normalize lead details

The system SHALL normalize extracted business data into lead records containing available name, category, address, phone, website, rating, review count, Google Maps URL, description, and source metadata.

#### Scenario: Partial business details are available

- **WHEN** a discovered business omits one or more optional fields
- **THEN** the record preserves available data and uses safe defaults for missing fields

### Requirement: Avoid duplicate leads within a search

The system SHALL deduplicate discovered businesses by their Google Maps place identity before returning results.

#### Scenario: A business appears repeatedly in Maps results

- **WHEN** multiple result entries reference the same place identity
- **THEN** the system includes that business once in the output
