import { RepoScanner } from '../scanner/repo-scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('RepoScanner', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-scanner-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should scan an empty repository', async () => {
    const scanner = new RepoScanner(tempDir);
    const assets = await scanner.scan();

    expect(assets.repoPath).toBe(tempDir);
    expect(assets.agentsMd).toBeUndefined();
    expect(assets.claudeAssets).toBeUndefined();
    expect(assets.codexAssets).toBeUndefined();
  });

  it('should find AGENTS.md if present', async () => {
    const agentsMdContent = '# Agent Instructions\n\nDo something useful.';
    fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), agentsMdContent);

    const scanner = new RepoScanner(tempDir);
    const assets = await scanner.scan();

    expect(assets.agentsMd).toBeDefined();
    expect(assets.agentsMd?.raw).toBe(agentsMdContent);
  });

  it('should find Claude Code assets if present', async () => {
    const claudeDir = path.join(tempDir, '.claude');
    const skillsDir = path.join(claudeDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    fs.writeFileSync(path.join(skillsDir, 'test-skill.md'), '# Test Skill\n\nDoes stuff.');
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ some: 'setting' })
    );

    const scanner = new RepoScanner(tempDir);
    const assets = await scanner.scan();

    expect(assets.claudeAssets).toBeDefined();
    expect(assets.claudeAssets?.skills).toHaveLength(1);
    expect(assets.claudeAssets?.skills?.[0].name).toBe('test-skill');
    expect(assets.claudeAssets?.settings).toEqual({ some: 'setting' });
  });

  it('should find MCP config if present', async () => {
    const mcpConfig = {
      servers: [{ name: 'test-server', endpoint: 'http://localhost:3000' }],
    };
    fs.writeFileSync(path.join(tempDir, '.mcp.json'), JSON.stringify(mcpConfig));

    const scanner = new RepoScanner(tempDir);
    const assets = await scanner.scan();

    expect(assets.mcpConfig).toBeDefined();
    expect(assets.mcpConfig?.servers).toHaveLength(1);
  });

  it('should throw error for non-existent path', async () => {
    const scanner = new RepoScanner('/non/existent/path');
    await expect(scanner.scan()).rejects.toThrow('Repository path does not exist');
  });
});
