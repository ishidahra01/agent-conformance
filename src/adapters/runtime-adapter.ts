import { RuntimeType, ExecutionTrace } from '../types';

/**
 * Base interface for runtime adapters
 */
export interface RuntimeAdapter {
  /**
   * Get the runtime type this adapter supports
   */
  getRuntime(): RuntimeType;

  /**
   * Execute a task using this runtime
   * @param repoPath Path to the repository
   * @param task Task to execute
   * @param options Additional execution options
   */
  execute(
    repoPath: string,
    task: string,
    options?: ExecutionOptions
  ): Promise<ExecutionTrace>;

  /**
   * Check if this runtime is available in the current environment
   */
  isAvailable(): Promise<boolean>;
}

export interface ExecutionOptions {
  timeout?: number;
  env?: Record<string, string>;
  workingDir?: string;
}
