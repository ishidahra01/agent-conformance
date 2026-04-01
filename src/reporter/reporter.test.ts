import { Reporter, ReportFormat } from '../reporter/reporter';
import {
  ConformanceResult,
  ConformanceVerdict,
  RuntimeType,
  ExecutionTrace,
  ExecutionOutcome,
} from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Reporter', () => {
  let tempDir: string;
  let reporter: Reporter;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporter-test-'));
    reporter = new Reporter(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const createMockResult = (): ConformanceResult => {
    const trace: ExecutionTrace = {
      runtime: RuntimeType.CLAUDE_CODE,
      task: 'test-task',
      startTime: new Date(),
      endTime: new Date(),
      filesRead: ['file1.ts'],
      filesModified: [],
      filesCreated: [],
      filesDeleted: [],
      toolUsage: [],
      approvalEvents: [],
      skillsInvoked: [],
      outcome: ExecutionOutcome.SUCCESS,
      metrics: { durationMs: 1000 },
    };

    return {
      task: 'test-task',
      runtimeResults: new Map([
        [
          RuntimeType.CLAUDE_CODE,
          {
            runtime: RuntimeType.CLAUDE_CODE,
            passed: true,
            violations: [],
            warnings: [],
            trace,
          },
        ],
      ]),
      verdict: ConformanceVerdict.PASS,
      violations: [],
      warnings: [],
      timestamp: new Date(),
    };
  };

  it('should generate JSON report', async () => {
    const result = createMockResult();
    const reportPath = await reporter.generate(result, ReportFormat.JSON);

    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.task).toBe('test-task');
    expect(parsed.verdict).toBe('pass');
  });

  it('should generate Markdown report', async () => {
    const result = createMockResult();
    const reportPath = await reporter.generate(result, ReportFormat.MARKDOWN);

    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('# Conformance Report');
    expect(content).toContain('**Task:** test-task');
    expect(content).toContain('**Verdict:** PASS');
  });

  it('should generate HTML report', async () => {
    const result = createMockResult();
    const reportPath = await reporter.generate(result, ReportFormat.HTML);

    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Conformance Report');
    expect(content).toContain('test-task');
  });

  it('should create output directory if it does not exist', async () => {
    const newDir = path.join(tempDir, 'subdir', 'reports');
    const newReporter = new Reporter(newDir);
    const result = createMockResult();

    const reportPath = await newReporter.generate(result, ReportFormat.JSON);

    expect(fs.existsSync(newDir)).toBe(true);
    expect(fs.existsSync(reportPath)).toBe(true);
  });
});
