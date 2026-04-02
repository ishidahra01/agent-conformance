# Example Repository Agent Instructions

This repository demonstrates agent-conformance capabilities.

## Instructions

- Always follow the coding standards defined in CONTRIBUTING.md
- Request approval before modifying production configuration
- Keep all changes minimal and focused
- Run tests before committing changes

## Tasks

### PR Review
Review pull requests for code quality, test coverage, and compliance with repo standards.

**Constraints:**
- Read-only operation
- Must not modify any files
- May add review comments

### Docs Sync
Synchronize code documentation with implementation.

**Constraints:**
- May only modify files under `docs/` directory
- Must not touch source code

### Release Prep
Prepare the repository for a new release.

**Constraints:**
- May update version files
- May update changelogs
- Must not modify production config
