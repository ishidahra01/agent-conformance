/**
 * Common types and interfaces for the agent-conformance tool
 */

/**
 * Supported runtime types
 */
export enum RuntimeType {
  CLAUDE_CODE = 'claude',
  CODEX = 'codex',
}

/**
 * Normalized representation of repo-level agent assets
 */
export interface RepoAssets {
  /** Path to the repository root */
  repoPath: string;
  /** Parsed AGENTS.md content if present */
  agentsMd?: AgentsMdContent;
  /** Claude Code specific assets */
  claudeAssets?: ClaudeAssets;
  /** Codex specific assets */
  codexAssets?: CodexAssets;
  /** MCP configuration */
  mcpConfig?: McpConfig;
  /** Repo-level policy hints */
  policy?: PolicyConfig;
}

export interface AgentsMdContent {
  raw: string;
  instructions?: string[];
  tasks?: TaskDefinition[];
}

export interface TaskDefinition {
  name: string;
  description: string;
  constraints?: string[];
}

export interface ClaudeAssets {
  skills?: SkillDefinition[];
  settings?: Record<string, unknown>;
  hooks?: Record<string, string>;
}

export interface CodexAssets {
  config?: Record<string, unknown>;
  instructions?: string[];
}

export interface McpConfig {
  servers?: McpServerConfig[];
  tools?: string[];
}

export interface McpServerConfig {
  name: string;
  endpoint?: string;
  config?: Record<string, unknown>;
}

export interface PolicyConfig {
  readOnlyPaths?: string[];
  allowedPaths?: string[];
  disallowedPaths?: string[];
  requiredApprovals?: string[];
}

export interface SkillDefinition {
  name: string;
  path: string;
  content: string;
}

/**
 * Execution trace from a runtime
 */
export interface ExecutionTrace {
  /** Runtime that produced this trace */
  runtime: RuntimeType;
  /** Task that was executed */
  task: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Files that were read */
  filesRead: string[];
  /** Files that were modified */
  filesModified: string[];
  /** Files that were created */
  filesCreated: string[];
  /** Files that were deleted */
  filesDeleted: string[];
  /** MCP/tool usage */
  toolUsage: ToolUsage[];
  /** Permission prompts or approval events */
  approvalEvents: ApprovalEvent[];
  /** Skills or workflows invoked */
  skillsInvoked: string[];
  /** Execution outcome */
  outcome: ExecutionOutcome;
  /** Basic timing metrics */
  metrics: ExecutionMetrics;
  /** Raw output (optional) */
  rawOutput?: string;
}

export interface ToolUsage {
  toolName: string;
  callCount: number;
  server?: string;
}

export interface ApprovalEvent {
  timestamp: Date;
  action: string;
  approved: boolean;
  context?: string;
}

export enum ExecutionOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export interface ExecutionMetrics {
  durationMs: number;
  tokensUsed?: number;
  apiCalls?: number;
}

/**
 * Conformance check result
 */
export interface ConformanceResult {
  /** Task being evaluated */
  task: string;
  /** Runtime results */
  runtimeResults: Map<RuntimeType, RuntimeConformance>;
  /** Overall verdict */
  verdict: ConformanceVerdict;
  /** Violations found */
  violations: Violation[];
  /** Warnings */
  warnings: Warning[];
  /** Timestamp */
  timestamp: Date;
}

export interface RuntimeConformance {
  runtime: RuntimeType;
  passed: boolean;
  violations: Violation[];
  warnings: Warning[];
  trace: ExecutionTrace;
}

export enum ConformanceVerdict {
  PASS = 'pass',
  WARN = 'warn',
  FAIL = 'fail',
}

export interface Violation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  context?: string;
}

export interface Warning {
  message: string;
  context?: string;
}

/**
 * Configuration for the CLI tool
 */
export interface ToolConfig {
  /** Repository path */
  repoPath: string;
  /** Output directory for reports */
  outputDir: string;
  /** Runtimes to test */
  runtimes: RuntimeType[];
  /** Tasks to execute */
  tasks: string[];
  /** Log level */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}
