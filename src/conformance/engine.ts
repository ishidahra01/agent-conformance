import {
  ExecutionTrace,
  ConformanceResult,
  RuntimeConformance,
  ConformanceVerdict,
  Violation,
  Warning,
  RuntimeType,
  PolicyConfig,
} from '../types';
import { logger } from '../logger';

/**
 * Engine for evaluating conformance of execution traces against policy
 */
export class ConformanceEngine {
  constructor(private policy?: PolicyConfig) {}

  /**
   * Evaluate traces and produce conformance result
   */
  evaluate(task: string, traces: ExecutionTrace[]): ConformanceResult {
    logger.info(`Evaluating conformance for task: ${task}`);

    const runtimeResults = new Map<RuntimeType, RuntimeConformance>();
    const allViolations: Violation[] = [];
    const allWarnings: Warning[] = [];

    for (const trace of traces) {
      const { violations, warnings } = this.evaluateTrace(trace);
      const passed = violations.filter((v) => v.severity === 'error').length === 0;

      runtimeResults.set(trace.runtime, {
        runtime: trace.runtime,
        passed,
        violations,
        warnings,
        trace,
      });

      allViolations.push(...violations);
      allWarnings.push(...warnings);
    }

    const verdict = this.determineVerdict(allViolations);

    return {
      task,
      runtimeResults,
      verdict,
      violations: allViolations,
      warnings: allWarnings,
      timestamp: new Date(),
    };
  }

  private evaluateTrace(trace: ExecutionTrace): { violations: Violation[]; warnings: Warning[] } {
    const violations: Violation[] = [];
    const warnings: Warning[] = [];

    // Check file modifications against policy
    if (this.policy?.readOnlyPaths) {
      for (const modifiedFile of trace.filesModified) {
        for (const readOnlyPath of this.policy.readOnlyPaths) {
          if (modifiedFile.includes(readOnlyPath)) {
            violations.push({
              rule: 'no-modify-readonly-paths',
              severity: 'error',
              message: `Modified file in read-only path: ${modifiedFile}`,
              context: `Runtime: ${trace.runtime}`,
            });
          }
        }
      }
    }

    // Check disallowed paths
    if (this.policy?.disallowedPaths) {
      for (const file of [...trace.filesRead, ...trace.filesModified]) {
        for (const disallowedPath of this.policy.disallowedPaths) {
          if (file.includes(disallowedPath)) {
            violations.push({
              rule: 'no-access-disallowed-paths',
              severity: 'error',
              message: `Accessed disallowed path: ${file}`,
              context: `Runtime: ${trace.runtime}`,
            });
          }
        }
      }
    }

    // Warn on execution failures
    if (trace.outcome !== 'success') {
      warnings.push({
        message: `Execution did not complete successfully: ${trace.outcome}`,
        context: `Runtime: ${trace.runtime}`,
      });
    }

    return { violations, warnings };
  }

  private determineVerdict(violations: Violation[]): ConformanceVerdict {
    const errorCount = violations.filter((v) => v.severity === 'error').length;
    const warningCount = violations.filter((v) => v.severity === 'warning').length;

    if (errorCount > 0) {
      return ConformanceVerdict.FAIL;
    }
    if (warningCount > 0) {
      return ConformanceVerdict.WARN;
    }
    return ConformanceVerdict.PASS;
  }
}
