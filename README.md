# agent-conformance
Verify how coding agents behave against repo-level instructions, skills, MCP config, and policy—then generate conformance reports across runtimes like Claude Code and Codex.

## What is this?

`agent-conformance` is a CLI-first verifier for coding-agent workflows.

It reads repo-level agent assets such as:

- `AGENTS.md`
- skill definitions
- MCP configuration
- runtime-specific config
- repo policy

Then it can run one or more agent runtimes against the same task, normalize the results, and produce a conformance report.

The goal is not to build another coding agent.

The goal is to help teams answer questions like:

- Will this repo behave the same under Claude Code and Codex?
- Did a new skill or MCP config expand the agent’s action surface?
- Is this task still safe to automate?
- Did the runtime violate repo-level policy?
- Can we review agent configuration changes in pull requests?

## Why this exists

Coding agents are becoming repo-native.

Teams are starting to store agent instructions, skills, hooks, and MCP config inside repositories. But once that happens, a new problem appears:

- behavior becomes harder to predict
- runtime differences become important
- policy drift becomes easy
- migration and multi-runtime usage become risky
- agent config changes need review just like code changes

`agent-conformance` treats repo-level agent setup as something that can be tested, compared, and reviewed.

## What it does

`agent-conformance` has two jobs:

### 1. Scan and normalize repo-level agent assets

It discovers and parses assets such as:

- `AGENTS.md`
- `.claude/skills/`
- `.claude/settings.json`
- `.codex/`
- `.mcp.json`
- other runtime-specific config
- custom instructions / policy files

These are normalized into a common internal representation.

### 2. Execute comparable tasks across runtimes

For a given task such as:

- PR review
- docs sync
- release prep

the tool can run multiple runtimes against the same repo and task, then compare:

- files read / modified
- tools or MCP servers used
- permission / approval events
- skill or workflow invocation signals
- exit status
- timing
- policy violations

The output is a conformance report, not just raw logs.

## What it is not

`agent-conformance` is not:

- a managed runtime
- a replacement for Claude Code or Codex
- a hosted orchestration platform
- an identity broker
- the system of record for agent memory or permissions

It is a verifier, comparer, and evidence generator.

## Trust boundary

This project is designed to keep trust boundaries simple.

By default:

- you use your own runtimes
- you use your own accounts / API keys
- you run this locally or in your CI
- this tool does not need to become your central agent platform

That makes it easier to adopt in early teams.

## Supported runtimes

### v0 target runtimes
- Claude Code
- Codex

### Future runtime support
The architecture is intended to support additional runtimes, including:

- self-hosted coding agents
- internal company agents
- custom agent runners
- future managed runtimes

A runtime can be integrated if it can provide some combination of:

- an invocation mechanism (CLI / SDK / API)
- observable execution output
- enough metadata to normalize behavior

## Supported repo assets

Initial support targets:

- `AGENTS.md`
- Claude Code skills / settings / hooks
- Codex repo config
- `.mcp.json`
- repo-level policy hints
- task-specific instructions

The internal model should remain extensible so teams can map their own agent assets into the same representation later.

## Core concepts

### Repo assets
Files in the repository that define how agents should behave.

Examples:
- instructions
- skills
- hooks
- MCP endpoints
- task boundaries
- policy constraints

### Runtime adapter
A runtime-specific layer that can invoke an agent and collect execution output.

Examples:
- Claude Code adapter
- Codex adapter
- future custom runtime adapter

### Normalized trace
A runtime-agnostic representation of what happened during execution.

Examples:
- files touched
- tools called
- approval prompts
- task outcome
- timing
- policy-relevant events

### Conformance rules
Rules that evaluate whether runtime behavior matched repo expectations.

Examples:
- a PR review task must not modify files
- a docs task may only edit `docs/`
- production config must never be touched
- a certain MCP server must not be used for this task

## Example use cases

### Compare Claude Code vs Codex before rollout
A team wants to test Codex in a repo already using Claude Code.

They want to know:
- will the same task behave similarly?
- will it touch different files?
- will it require different approvals?
- does it violate existing repo policy?

### Review a new MCP or skill change in a PR
A developer adds a new MCP server or skill.

The team wants CI to say:
- what changed in the agent action surface?
- what new permissions may be needed?
- should this require manual approval?

### Define safe automation boundaries
A platform team wants to allow:
- PR review automation
- docs sync automation

but not:
- production config edits
- uncontrolled runtime behavior

This tool helps establish and test those boundaries.

### Support internal/custom agents later
A company has its own coding agent.

They want the same repo-level verification model to work across:
- Claude Code
- Codex
- their internal agent

This project is intended to support that by using a common IR plus runtime adapters.

## CLI shape

Early CLI direction:

```bash
agent-conformance scan --repo .
agent-conformance run --repo . --task pr-review --runtime claude --runtime codex
agent-conformance report --input ./out/run.json --format md
````

This is not a final CLI contract yet, but it reflects the intended flow:

* scan
* execute
* normalize
* score
* report

## Example report

A report may look like this:

* Policy expectation:

  * PR review must not modify files
  * production config must not be touched

* Claude result:

  * success
  * modified files: 0
  * MCP calls: docs(1)

* Codex result:

  * success
  * modified files: 2
  * permission prompts: 1

* Verdict:

  * Claude: PASS
  * Codex: FAIL

* Why:

  * Codex modified files during a read-only task

* Suggested remediation:

  * tighten runtime config
  * add explicit read-only task instructions
  * require approval for this task in this runtime

## Architecture

The project is organized around five layers:

1. **Repo asset discovery**

   * find and load repo-level agent assets

2. **Normalization IR**

   * convert heterogeneous config into a common representation

3. **Runtime adapters**

   * invoke Claude Code, Codex, and future custom runtimes

4. **Trace normalization**

   * convert runtime-specific execution output into a common schema

5. **Conformance scoring + reporting**

   * evaluate policy fit and generate machine-readable + human-readable reports

## v0 scope

The first version should stay narrow.

### In scope

* CLI-first workflow
* Claude Code + Codex
* a few canonical tasks:

  * PR review
  * docs sync
  * release prep
* Markdown / JSON / HTML reports
* GitHub Action integration
* repo-level policy checks
* deterministic conformance reporting

### Out of scope

* hosted SaaS control plane
* full identity / auth brokering
* centralized secrets management
* long-term memory platform
* broad non-coding-agent orchestration
* support for every runtime feature on day one

## Extensibility for custom/internal agents

This project should be built so that teams can add support for their own agents later.

That means:

* custom repo asset parsers can map internal config into the IR
* custom runtime adapters can invoke internal agents
* custom trace transformers can normalize internal execution logs
* conformance rules remain runtime-agnostic where possible

In practice, this means a company could eventually use the same framework to validate:

* Claude Code
* Codex
* an internal coding agent
* a self-hosted OSS agent

against the same repo policy.

## Security model

This project should aim to be safe by default:

* local/CI execution first
* bring-your-own runtime/account
* avoid becoming the holder of customer secrets unless explicitly necessary
* prefer deterministic comparison over opaque judgment
* make policy violations explicit and auditable

## Roadmap

### Near-term

* repo asset discovery
* Claude/Codex adapters
* normalized trace model
* conformance rule engine
* Markdown/HTML/JSON reports
* GitHub Action

### Later

* custom runtime adapter SDK
* pluggable rule packs
* conformance baselines over time
* signed reports / artifact history
* richer PR gating workflows
* internal agent support

## Contributing

Contributions are welcome, especially around:

* runtime adapters
* repo asset parsers
* conformance rules
* trace normalization
* sample repos / fixtures
* report UX
