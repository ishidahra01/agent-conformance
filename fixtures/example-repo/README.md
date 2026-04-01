# Example Repository

This is an example repository for testing agent-conformance.

## About

This repository contains sample agent configuration files to demonstrate
how `agent-conformance` can be used to verify agent behavior.

## Contents

- `AGENTS.md` - Repo-level agent instructions
- `.claude/skills/` - Claude Code skills
- `.claude/settings.json` - Claude Code settings
- `.mcp.json` - MCP server configuration
- `.agent-policy.json` - Repository policy constraints

## Usage

Run the conformance tool against this repository:

```bash
# Scan for agent assets
agent-conformance scan --repo fixtures/example-repo

# Run a task
agent-conformance run --repo fixtures/example-repo --task pr-review --runtime claude

# Generate report
agent-conformance report --input out/traces.json --format md
```
