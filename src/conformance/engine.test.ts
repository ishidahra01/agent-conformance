import { ConformanceEngine } from '../conformance/engine';
import { ExecutionTrace, RuntimeType, ExecutionOutcome, PolicyConfig } from '../types';

describe('ConformanceEngine', () => {
  const createMockTrace = (runtime: RuntimeType, filesModified: string[] = []): ExecutionTrace => ({
    runtime,
    task: 'test-task',
    startTime: new Date(),
    endTime: new Date(),
    filesRead: [],
    filesModified,
    filesCreated: [],
    filesDeleted: [],
    toolUsage: [],
    approvalEvents: [],
    skillsInvoked: [],
    outcome: ExecutionOutcome.SUCCESS,
    metrics: { durationMs: 1000 },
  });

  it('should pass when no violations found', () => {
    const engine = new ConformanceEngine();
    const traces = [createMockTrace(RuntimeType.CLAUDE_CODE)];

    const result = engine.evaluate('test-task', traces);

    expect(result.verdict).toBe('pass');
    expect(result.violations).toHaveLength(0);
  });

  it('should fail when read-only paths are modified', () => {
    const policy: PolicyConfig = {
      readOnlyPaths: ['config/'],
    };
    const engine = new ConformanceEngine(policy);
    const traces = [createMockTrace(RuntimeType.CLAUDE_CODE, ['config/production.json'])];

    const result = engine.evaluate('test-task', traces);

    expect(result.verdict).toBe('fail');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('no-modify-readonly-paths');
  });

  it('should fail when disallowed paths are accessed', () => {
    const policy: PolicyConfig = {
      disallowedPaths: ['secrets/'],
    };
    const engine = new ConformanceEngine(policy);
    const trace = createMockTrace(RuntimeType.CLAUDE_CODE);
    trace.filesRead = ['secrets/api-key.txt'];

    const result = engine.evaluate('test-task', [trace]);

    expect(result.verdict).toBe('fail');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('no-access-disallowed-paths');
  });

  it('should evaluate multiple runtimes', () => {
    const engine = new ConformanceEngine();
    const traces = [
      createMockTrace(RuntimeType.CLAUDE_CODE),
      createMockTrace(RuntimeType.CODEX),
    ];

    const result = engine.evaluate('test-task', traces);

    expect(result.runtimeResults.size).toBe(2);
    expect(result.runtimeResults.has(RuntimeType.CLAUDE_CODE)).toBe(true);
    expect(result.runtimeResults.has(RuntimeType.CODEX)).toBe(true);
  });
});
