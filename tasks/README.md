# Canonical Tasks

This directory contains canonical task definitions for agent-conformance testing.

## Available Tasks

### 1. PR Review (`pr-review.md`)
**Objective:** Review pull requests for code quality and compliance
**Constraints:** Read-only, no file modifications
**Use case:** Automated code review workflows

### 2. Docs Sync (`docs-sync.md`)
**Objective:** Synchronize documentation with code
**Constraints:** Modify only `docs/` directory
**Use case:** Documentation maintenance automation

### 3. Release Prep (`release-prep.md`)
**Objective:** Prepare repository for release
**Constraints:** Update versions/changelog, no production config changes
**Use case:** Release automation workflows

## Using Tasks

### Command Line

```bash
# Run PR review task
agent-conformance run --repo . --task pr-review --runtime claude --runtime codex

# Run docs sync task
agent-conformance run --repo . --task docs-sync --runtime claude

# Run release prep task
agent-conformance run --repo . --task release-prep --runtime claude --runtime codex
```

### In GitHub Actions

```yaml
- uses: agent-conformance/agent-conformance@v1
  with:
    repo-path: '.'
    task: 'pr-review'
    runtimes: 'claude,codex'
    fail-on-violations: 'true'
```

## Task Structure

Each task definition includes:

1. **Description** - What the task does
2. **Objective** - The goal of the task
3. **Constraints** - File operation rules and boundaries
4. **Policy Requirements** - Conformance requirements
5. **Expected Runtime Behavior** - How runtimes should behave
6. **Example Usage** - Command line examples
7. **Example Policy Config** - Recommended policy settings

## Conformance Evaluation

Tasks are evaluated against policy to ensure:
- File modifications respect allowed/disallowed paths
- Read-only tasks don't modify files
- Production config remains unchanged
- Security-sensitive paths aren't accessed

## Adding Custom Tasks

To add a custom task:

1. Create a markdown file in this directory
2. Follow the structure of existing tasks
3. Define clear constraints and policy requirements
4. Include example usage and policy config
5. Document expected runtime behavior

## Best Practices

- Keep tasks focused and single-purpose
- Define clear success criteria
- Specify all file operation constraints
- Include policy config examples
- Test with multiple runtimes
- Document edge cases
