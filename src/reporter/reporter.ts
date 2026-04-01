import * as fs from 'fs';
import * as path from 'path';
import { ConformanceResult, RuntimeType } from '../types';
import { logger } from '../logger';
import { ReportError } from '../errors';

/**
 * Report format types
 */
export enum ReportFormat {
  JSON = 'json',
  MARKDOWN = 'md',
  HTML = 'html',
}

/**
 * Reporter for generating conformance reports
 */
export class Reporter {
  constructor(private outputDir: string) {
    this.ensureOutputDir();
  }

  /**
   * Generate a report in the specified format
   */
  async generate(result: ConformanceResult, format: ReportFormat): Promise<string> {
    logger.info(`Generating ${format} report`);

    let content: string;
    let filename: string;

    switch (format) {
      case ReportFormat.JSON:
        content = this.generateJson(result);
        filename = `conformance-${Date.now()}.json`;
        break;
      case ReportFormat.MARKDOWN:
        content = this.generateMarkdown(result);
        filename = `conformance-${Date.now()}.md`;
        break;
      case ReportFormat.HTML:
        content = this.generateHtml(result);
        filename = `conformance-${Date.now()}.html`;
        break;
      default:
        throw new ReportError(`Unsupported format: ${format}`);
    }

    const outputPath = path.join(this.outputDir, filename);
    fs.writeFileSync(outputPath, content, 'utf-8');
    logger.info(`Report written to ${outputPath}`);

    return outputPath;
  }

  private generateJson(result: ConformanceResult): string {
    // Convert Map to object for JSON serialization
    const runtimeResults: Record<string, unknown> = {};
    result.runtimeResults.forEach((value, key) => {
      runtimeResults[key] = value;
    });

    return JSON.stringify(
      {
        task: result.task,
        verdict: result.verdict,
        timestamp: result.timestamp,
        runtimeResults,
        violations: result.violations,
        warnings: result.warnings,
      },
      null,
      2
    );
  }

  private generateMarkdown(result: ConformanceResult): string {
    let md = `# Conformance Report\n\n`;
    md += `**Task:** ${result.task}\n\n`;
    md += `**Verdict:** ${result.verdict.toUpperCase()}\n\n`;
    md += `**Timestamp:** ${result.timestamp.toISOString()}\n\n`;

    md += `## Summary\n\n`;
    md += `| Runtime | Status | Violations | Warnings |\n`;
    md += `|---------|--------|------------|----------|\n`;

    result.runtimeResults.forEach((runtimeResult, runtime) => {
      const status = runtimeResult.passed ? '✅ PASS' : '❌ FAIL';
      md += `| ${runtime} | ${status} | ${runtimeResult.violations.length} | ${runtimeResult.warnings.length} |\n`;
    });

    md += `\n## Details\n\n`;

    result.runtimeResults.forEach((runtimeResult, runtime) => {
      md += `### ${runtime}\n\n`;

      if (runtimeResult.violations.length > 0) {
        md += `#### Violations\n\n`;
        runtimeResult.violations.forEach((v) => {
          md += `- **[${v.severity.toUpperCase()}]** ${v.rule}: ${v.message}\n`;
          if (v.context) {
            md += `  - ${v.context}\n`;
          }
        });
        md += `\n`;
      }

      if (runtimeResult.warnings.length > 0) {
        md += `#### Warnings\n\n`;
        runtimeResult.warnings.forEach((w) => {
          md += `- ${w.message}\n`;
          if (w.context) {
            md += `  - ${w.context}\n`;
          }
        });
        md += `\n`;
      }

      // Execution metrics
      md += `#### Execution Metrics\n\n`;
      md += `- Duration: ${runtimeResult.trace.metrics.durationMs}ms\n`;
      md += `- Files read: ${runtimeResult.trace.filesRead.length}\n`;
      md += `- Files modified: ${runtimeResult.trace.filesModified.length}\n`;
      md += `- Outcome: ${runtimeResult.trace.outcome}\n\n`;
    });

    return md;
  }

  private generateHtml(result: ConformanceResult): string {
    const verdictColor = {
      pass: 'green',
      warn: 'orange',
      fail: 'red',
    }[result.verdict];

    let html = `<!DOCTYPE html>
<html>
<head>
  <title>Conformance Report - ${result.task}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
    h1 { color: #333; }
    .verdict { font-size: 24px; font-weight: bold; color: ${verdictColor}; }
    .summary-table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .summary-table th { background-color: #f2f2f2; }
    .pass { color: green; }
    .fail { color: red; }
    .violation { background-color: #ffe6e6; padding: 10px; margin: 10px 0; border-left: 4px solid red; }
    .warning { background-color: #fff8e6; padding: 10px; margin: 10px 0; border-left: 4px solid orange; }
  </style>
</head>
<body>
  <h1>Conformance Report</h1>
  <p><strong>Task:</strong> ${result.task}</p>
  <p><strong>Verdict:</strong> <span class="verdict">${result.verdict.toUpperCase()}</span></p>
  <p><strong>Timestamp:</strong> ${result.timestamp.toISOString()}</p>

  <h2>Summary</h2>
  <table class="summary-table">
    <thead>
      <tr>
        <th>Runtime</th>
        <th>Status</th>
        <th>Violations</th>
        <th>Warnings</th>
      </tr>
    </thead>
    <tbody>`;

    result.runtimeResults.forEach((runtimeResult, runtime) => {
      const status = runtimeResult.passed ? 'PASS' : 'FAIL';
      const statusClass = runtimeResult.passed ? 'pass' : 'fail';
      html += `
      <tr>
        <td>${runtime}</td>
        <td class="${statusClass}">${status}</td>
        <td>${runtimeResult.violations.length}</td>
        <td>${runtimeResult.warnings.length}</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>

  <h2>Details</h2>`;

    result.runtimeResults.forEach((runtimeResult, runtime) => {
      html += `
  <h3>${runtime}</h3>`;

      if (runtimeResult.violations.length > 0) {
        html += `<h4>Violations</h4>`;
        runtimeResult.violations.forEach((v) => {
          html += `
  <div class="violation">
    <strong>[${v.severity.toUpperCase()}]</strong> ${v.rule}: ${v.message}
    ${v.context ? `<br><em>${v.context}</em>` : ''}
  </div>`;
        });
      }

      if (runtimeResult.warnings.length > 0) {
        html += `<h4>Warnings</h4>`;
        runtimeResult.warnings.forEach((w) => {
          html += `
  <div class="warning">
    ${w.message}
    ${w.context ? `<br><em>${w.context}</em>` : ''}
  </div>`;
        });
      }

      html += `
  <h4>Execution Metrics</h4>
  <ul>
    <li>Duration: ${runtimeResult.trace.metrics.durationMs}ms</li>
    <li>Files read: ${runtimeResult.trace.filesRead.length}</li>
    <li>Files modified: ${runtimeResult.trace.filesModified.length}</li>
    <li>Outcome: ${runtimeResult.trace.outcome}</li>
  </ul>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.debug(`Created output directory: ${this.outputDir}`);
    }
  }
}
