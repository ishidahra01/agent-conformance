import { ClaudeAdapter } from './claude-adapter';
import { RuntimeType, ExecutionOutcome } from '../types';
import { execFile } from 'child_process';

// Mock the file-tracker module
jest.mock('./file-tracker', () => ({
  createSnapshot: jest.fn(() => new Map()),
  compareSnapshots: jest.fn(() => ({
    filesRead: [],
    filesModified: [],
    filesCreated: [],
    filesDeleted: [],
  })),
}));

// Mock child_process and util modules
jest.mock('child_process');
jest.mock('util', () => {
  const actual = jest.requireActual('util');
  return {
    ...actual,
    promisify: (fn: any) => fn,
  };
});

const execFileMock = execFile as jest.MockedFunction<typeof execFile>;

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter();
    jest.clearAllMocks();
  });

  describe('getRuntime', () => {
    it('should return CLAUDE_CODE runtime type', () => {
      expect(adapter.getRuntime()).toBe(RuntimeType.CLAUDE_CODE);
    });
  });

  describe('isAvailable', () => {
    it('should return true when claude CLI is available', async () => {
      (execFileMock as any).mockResolvedValueOnce({ stdout: 'claude version 1.0.0', stderr: '' });

      const result = await adapter.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when claude CLI is not available', async () => {
      (execFileMock as any).mockRejectedValueOnce(new Error('command not found'));

      const result = await adapter.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    it('should return FAILURE when CLI is not available', async () => {
      (execFileMock as any).mockRejectedValueOnce(new Error('command not found'));

      const trace = await adapter.execute('/tmp/test-repo', 'test task');

      expect(trace.runtime).toBe(RuntimeType.CLAUDE_CODE);
      expect(trace.task).toBe('test task');
      expect(trace.outcome).toBe(ExecutionOutcome.FAILURE);
      expect(trace.rawOutput).toBe('Claude Code CLI not available');
    });

    it('should execute successfully when CLI is available', async () => {
      (execFileMock as any)
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'Task completed', stderr: '' });

      const trace = await adapter.execute('/tmp/test-repo', 'test task');

      expect(trace.runtime).toBe(RuntimeType.CLAUDE_CODE);
      expect(trace.task).toBe('test task');
      expect(trace.outcome).toBe(ExecutionOutcome.SUCCESS);
      expect(trace.rawOutput).toContain('Task completed');
    });

    it('should handle execution failure', async () => {
      (execFileMock as any)
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0', stderr: '' })
        .mockRejectedValueOnce(Object.assign(new Error('Execution failed'), {
          stdout: 'Some output',
          stderr: 'Error occurred',
        }));

      const trace = await adapter.execute('/tmp/test-repo', 'test task');

      expect(trace.runtime).toBe(RuntimeType.CLAUDE_CODE);
      expect(trace.outcome).toBe(ExecutionOutcome.FAILURE);
    });

    it('should handle timeout', async () => {
      (execFileMock as any)
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0', stderr: '' })
        .mockRejectedValueOnce(Object.assign(new Error('Timeout'), {
          killed: true,
          signal: 'SIGTERM',
        }));

      const trace = await adapter.execute('/tmp/test-repo', 'test task');

      expect(trace.runtime).toBe(RuntimeType.CLAUDE_CODE);
      expect(trace.outcome).toBe(ExecutionOutcome.TIMEOUT);
    });
  });
});
