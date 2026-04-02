import {
  RuntimeType,
  ExecutionTrace,
  ExecutionOutcome,
  ExecutionMetrics,
} from '../types';
import { RuntimeAdapter, ExecutionOptions } from './runtime-adapter';
import { logger } from '../logger';
import { RuntimeError } from '../errors';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createSnapshot, compareSnapshots } from './file-tracker';

const execFileAsync = promisify(execFile);

/**
 * Adapter for Codex runtime
 */
export class CodexAdapter implements RuntimeAdapter {
  getRuntime(): RuntimeType {
    return RuntimeType.CODEX;
  }

  async execute(
    repoPath: string,
    task: string,
    options?: ExecutionOptions
  ): Promise<ExecutionTrace> {
    logger.info(`Executing task "${task}" with Codex`);

    // Check if CLI is available
    const available = await this.isAvailable();
    if (!available) {
      logger.warn('Codex CLI not available - returning mock trace with warning');
      const startTime = new Date();
      const endTime = new Date();
      const metrics: ExecutionMetrics = {
        durationMs: endTime.getTime() - startTime.getTime(),
      };

      return {
        runtime: RuntimeType.CODEX,
        task,
        startTime,
        endTime,
        filesRead: [],
        filesModified: [],
        filesCreated: [],
        filesDeleted: [],
        toolUsage: [],
        approvalEvents: [],
        skillsInvoked: [],
        outcome: ExecutionOutcome.FAILURE,
        metrics,
        rawOutput: 'Codex CLI not available',
      };
    }

    const startTime = new Date();

    // Create a snapshot of the file system before execution
    logger.debug('Creating pre-execution file snapshot');
    const beforeSnapshot = createSnapshot(repoPath);

    let rawOutput = '';
    let outcome = ExecutionOutcome.SUCCESS;

    try {
      // Execute the Codex CLI
      logger.debug('Executing Codex CLI');
      const workingDir = options?.workingDir || repoPath;
      const timeout = options?.timeout || 300000; // 5 minutes default

      const { stdout, stderr } = await execFileAsync(
        'codex',
        ['--non-interactive', task],
        {
          cwd: workingDir,
          env: { ...process.env, ...options?.env },
          timeout,
        }
      );

      rawOutput = stdout + stderr;
      logger.debug(`Codex execution completed`);
    } catch (error: any) {
      rawOutput = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;

      if (error.killed || error.signal === 'SIGTERM') {
        outcome = ExecutionOutcome.TIMEOUT;
        logger.error('Codex execution timed out');
      } else {
        outcome = ExecutionOutcome.FAILURE;
        logger.error(`Codex execution failed: ${error.message}`);
      }
    }

    const endTime = new Date();

    // Create a snapshot of the file system after execution
    logger.debug('Creating post-execution file snapshot');
    const afterSnapshot = createSnapshot(repoPath);

    // Compare snapshots to determine file changes
    const fileChanges = compareSnapshots(beforeSnapshot, afterSnapshot);

    const metrics: ExecutionMetrics = {
      durationMs: endTime.getTime() - startTime.getTime(),
    };

    return {
      runtime: RuntimeType.CODEX,
      task,
      startTime,
      endTime,
      filesRead: fileChanges.filesRead,
      filesModified: fileChanges.filesModified,
      filesCreated: fileChanges.filesCreated,
      filesDeleted: fileChanges.filesDeleted,
      toolUsage: [],
      approvalEvents: [],
      skillsInvoked: [],
      outcome,
      metrics,
      rawOutput,
    };
  }

  async isAvailable(): Promise<boolean> {
    logger.debug('Checking Codex availability');
    try {
      await execFileAsync('codex', ['--version']);
      logger.debug('Codex CLI is available');
      return true;
    } catch (error) {
      logger.debug('Codex CLI not found');
      return false;
    }
  }
}
