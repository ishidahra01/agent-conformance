import * as fs from 'fs';
import * as path from 'path';
import { RepoAssets, ClaudeAssets, CodexAssets, McpConfig, PolicyConfig } from '../types';
import { logger } from '../logger';
import { ScanError } from '../errors';

/**
 * Scanner for discovering and parsing repo-level agent assets
 */
export class RepoScanner {
  constructor(private repoPath: string) {}

  /**
   * Scan the repository and return normalized asset representation
   */
  async scan(): Promise<RepoAssets> {
    logger.info(`Scanning repository at ${this.repoPath}`);

    if (!fs.existsSync(this.repoPath)) {
      throw new ScanError(`Repository path does not exist: ${this.repoPath}`);
    }

    const assets: RepoAssets = {
      repoPath: this.repoPath,
    };

    // Scan for AGENTS.md
    assets.agentsMd = await this.scanAgentsMd();

    // Scan for Claude Code assets
    assets.claudeAssets = await this.scanClaudeAssets();

    // Scan for Codex assets
    assets.codexAssets = await this.scanCodexAssets();

    // Scan for MCP config
    assets.mcpConfig = await this.scanMcpConfig();

    // Scan for policy config
    assets.policy = await this.scanPolicyConfig();

    logger.info('Repository scan completed');
    return assets;
  }

  private async scanAgentsMd() {
    const agentsMdPath = path.join(this.repoPath, 'AGENTS.md');
    if (!fs.existsSync(agentsMdPath)) {
      logger.debug('AGENTS.md not found');
      return undefined;
    }

    try {
      const content = fs.readFileSync(agentsMdPath, 'utf-8');
      logger.info('Found AGENTS.md');
      return {
        raw: content,
        // Basic parsing - can be enhanced later
        instructions: this.extractInstructions(content),
        tasks: this.extractTasks(content),
      };
    } catch (error) {
      logger.warn(`Error reading AGENTS.md: ${error}`);
      return undefined;
    }
  }

  private async scanClaudeAssets(): Promise<ClaudeAssets | undefined> {
    const claudeDir = path.join(this.repoPath, '.claude');
    if (!fs.existsSync(claudeDir)) {
      logger.debug('.claude directory not found');
      return undefined;
    }

    const assets: ClaudeAssets = {};

    // Scan for skills
    const skillsDir = path.join(claudeDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      assets.skills = this.scanSkills(skillsDir);
    }

    // Scan for settings
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        assets.settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch (error) {
        logger.warn(`Error reading Claude settings: ${error}`);
      }
    }

    // Scan for hooks
    const hooksDir = path.join(claudeDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      assets.hooks = this.scanHooks(hooksDir);
    }

    logger.info('Scanned Claude Code assets');
    return Object.keys(assets).length > 0 ? assets : undefined;
  }

  private async scanCodexAssets(): Promise<CodexAssets | undefined> {
    const codexDir = path.join(this.repoPath, '.codex');
    if (!fs.existsSync(codexDir)) {
      logger.debug('.codex directory not found');
      return undefined;
    }

    const assets: CodexAssets = {};

    // Scan for Codex config
    const configPath = path.join(codexDir, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        assets.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (error) {
        logger.warn(`Error reading Codex config: ${error}`);
      }
    }

    logger.info('Scanned Codex assets');
    return Object.keys(assets).length > 0 ? assets : undefined;
  }

  private async scanMcpConfig(): Promise<McpConfig | undefined> {
    const mcpPath = path.join(this.repoPath, '.mcp.json');
    if (!fs.existsSync(mcpPath)) {
      logger.debug('.mcp.json not found');
      return undefined;
    }

    try {
      const config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      logger.info('Found MCP configuration');
      return config;
    } catch (error) {
      logger.warn(`Error reading MCP config: ${error}`);
      return undefined;
    }
  }

  private async scanPolicyConfig(): Promise<PolicyConfig | undefined> {
    const policyPath = path.join(this.repoPath, '.agent-policy.json');
    if (!fs.existsSync(policyPath)) {
      logger.debug('.agent-policy.json not found');
      return undefined;
    }

    try {
      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
      logger.info('Found policy configuration');
      return policy;
    } catch (error) {
      logger.warn(`Error reading policy config: ${error}`);
      return undefined;
    }
  }

  private scanSkills(skillsDir: string) {
    const skills = [];
    const files = fs.readdirSync(skillsDir);
    for (const file of files) {
      const skillPath = path.join(skillsDir, file);
      if (fs.statSync(skillPath).isFile() && file.endsWith('.md')) {
        try {
          skills.push({
            name: file.replace('.md', ''),
            path: skillPath,
            content: fs.readFileSync(skillPath, 'utf-8'),
          });
        } catch (error) {
          logger.warn(`Error reading skill ${file}: ${error}`);
        }
      }
    }
    return skills;
  }

  private scanHooks(hooksDir: string): Record<string, string> {
    const hooks: Record<string, string> = {};
    const files = fs.readdirSync(hooksDir);
    for (const file of files) {
      const hookPath = path.join(hooksDir, file);
      if (fs.statSync(hookPath).isFile()) {
        try {
          hooks[file] = fs.readFileSync(hookPath, 'utf-8');
        } catch (error) {
          logger.warn(`Error reading hook ${file}: ${error}`);
        }
      }
    }
    return hooks;
  }

  private extractInstructions(content: string): string[] {
    // Simple extraction - can be enhanced with better parsing
    const lines = content.split('\n');
    const instructions: string[] = [];
    let inInstructionsSection = false;

    for (const line of lines) {
      if (line.match(/^#+\s*instructions/i)) {
        inInstructionsSection = true;
        continue;
      }
      if (inInstructionsSection && line.match(/^#+\s*/)) {
        inInstructionsSection = false;
      }
      if (inInstructionsSection && line.trim()) {
        instructions.push(line.trim());
      }
    }

    return instructions;
  }

  private extractTasks(content: string) {
    // Simple extraction - can be enhanced with better parsing
    return [];
  }
}
