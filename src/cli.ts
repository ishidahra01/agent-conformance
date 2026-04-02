#!/usr/bin/env node

import { Command } from 'commander';
import { RepoScanner } from './scanner';
import { ClaudeAdapter, CodexAdapter, RuntimeAdapter } from './adapters';
import { ConformanceEngine } from './conformance';
import { Reporter, ReportFormat } from './reporter';
import { logger, setLogLevel } from './logger';
import { RuntimeType, ExecutionTrace } from './types';
import * as path from 'path';

const program = new Command();

program
  .name('agent-conformance')
  .description('Verify how coding agents behave against repo-level instructions and policy')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan repository for agent assets')
  .option('-r, --repo <path>', 'Repository path', '.')
  .option('-o, --output <path>', 'Output file for scan results')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        setLogLevel('debug');
      }

      const repoPath = path.resolve(options.repo);
      logger.info(`Scanning repository: ${repoPath}`);

      const scanner = new RepoScanner(repoPath);
      const assets = await scanner.scan();

      if (options.output) {
        const fs = await import('fs');
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(assets, null, 2));
        logger.info(`Scan results written to ${outputPath}`);
      } else {
        console.log(JSON.stringify(assets, null, 2));
      }

      logger.info('Scan completed successfully');
    } catch (error) {
      logger.error(`Scan failed: ${error}`);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run a task against one or more runtimes')
  .requiredOption('-r, --repo <path>', 'Repository path')
  .requiredOption('-t, --task <name>', 'Task to execute')
  .option('--runtime <runtime...>', 'Runtimes to test (claude, codex)', ['claude', 'codex'])
  .option('-o, --output <path>', 'Output directory for results', './out')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        setLogLevel('debug');
      }

      const repoPath = path.resolve(options.repo);
      const { task, runtime: runtimes, output } = options;

      logger.info(`Running task "${task}" against runtimes: ${runtimes.join(', ')}`);

      const adapters: RuntimeAdapter[] = [];
      for (const runtimeName of runtimes) {
        if (runtimeName === 'claude') {
          adapters.push(new ClaudeAdapter());
        } else if (runtimeName === 'codex') {
          adapters.push(new CodexAdapter());
        } else {
          logger.warn(`Unknown runtime: ${runtimeName}`);
        }
      }

      const traces: ExecutionTrace[] = [];
      for (const adapter of adapters) {
        const isAvailable = await adapter.isAvailable();
        if (!isAvailable) {
          logger.warn(`Runtime ${adapter.getRuntime()} is not available - using mock execution`);
        }

        const trace = await adapter.execute(repoPath, task);
        traces.push(trace);
      }

      // Save traces
      const fs = await import('fs');
      const outputDir = path.resolve(output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const tracesPath = path.join(outputDir, 'traces.json');
      fs.writeFileSync(tracesPath, JSON.stringify(traces, null, 2));
      logger.info(`Execution traces saved to ${tracesPath}`);

      logger.info('Run completed successfully');
    } catch (error) {
      logger.error(`Run failed: ${error}`);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate conformance report from execution traces')
  .requiredOption('-i, --input <path>', 'Input traces file')
  .requiredOption('-r, --repo <path>', 'Repository path')
  .option('-f, --format <format>', 'Report format (json, md, html)', 'md')
  .option('-o, --output <path>', 'Output directory', './out')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (options.verbose) {
        setLogLevel('debug');
      }

      const fs = await import('fs');
      const inputPath = path.resolve(options.input);
      const outputDir = path.resolve(options.output);
      const repoPath = path.resolve(options.repo);

      logger.info(`Generating report from ${inputPath}`);

      const tracesContent = fs.readFileSync(inputPath, 'utf-8');
      const traces: ExecutionTrace[] = JSON.parse(tracesContent);

      // Revive dates
      traces.forEach((trace) => {
        trace.startTime = new Date(trace.startTime);
        trace.endTime = new Date(trace.endTime);
      });

      if (traces.length === 0) {
        logger.error('No traces found in input file');
        process.exit(1);
      }

      const task = traces[0].task;

      // Scan repository for policy and task constraints
      logger.info('Scanning repository for policy and task constraints');
      const scanner = new RepoScanner(repoPath);
      const assets = await scanner.scan();

      // Create engine with policy and task constraints
      const engine = new ConformanceEngine(assets.policy, assets.agentsMd?.tasks, task);
      const result = engine.evaluate(task, traces);

      const reporter = new Reporter(outputDir);
      const format = options.format as ReportFormat;
      const reportPath = await reporter.generate(result, format);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Conformance Report Generated`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Task: ${task}`);
      console.log(`Verdict: ${result.verdict.toUpperCase()}`);
      console.log(`Report: ${reportPath}`);
      console.log(`${'='.repeat(60)}\n`);

      logger.info('Report generated successfully');

      // Exit with appropriate code
      if (result.verdict === 'fail') {
        process.exit(1);
      }
    } catch (error) {
      logger.error(`Report generation failed: ${error}`);
      process.exit(1);
    }
  });

program.parse();
