import {
  RuntimeType,
  ExecutionTrace,
  ExecutionOutcome,
  ExecutionMetrics,
} from '../types';
import { RuntimeAdapter, ExecutionOptions } from './runtime-adapter';
import { logger } from '../logger';
import { RuntimeError } from '../errors';

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

    const startTime = new Date();

    // TODO: Implement actual Codex execution
    // This is a placeholder implementation
    logger.warn('Codex adapter not fully implemented - returning mock trace');

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
      outcome: ExecutionOutcome.SUCCESS,
      metrics,
    };
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check if Codex CLI is available
    logger.debug('Checking Codex availability');
    return false;
  }
}
