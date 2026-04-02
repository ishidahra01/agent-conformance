import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createSnapshot, compareSnapshots } from './file-tracker';

describe('file-tracker', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-tracker-test-'));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('createSnapshot', () => {
    it('should create a snapshot of all files in directory', () => {
      // Create test files
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'file3.txt'), 'content3');

      const snapshot = createSnapshot(testDir);

      expect(snapshot.size).toBeGreaterThanOrEqual(3);
      expect(snapshot.has('file1.txt')).toBe(true);
      expect(snapshot.has('file2.txt')).toBe(true);
      expect(snapshot.has(path.join('subdir', 'file3.txt'))).toBe(true);
    });

    it('should skip .git and node_modules directories', () => {
      // Create test files
      fs.mkdirSync(path.join(testDir, '.git'));
      fs.writeFileSync(path.join(testDir, '.git', 'config'), 'git config');
      fs.mkdirSync(path.join(testDir, 'node_modules'));
      fs.writeFileSync(path.join(testDir, 'node_modules', 'package.js'), 'package');

      const snapshot = createSnapshot(testDir);

      // Should not include .git or node_modules files
      for (const [filePath] of snapshot) {
        expect(filePath).not.toContain('.git');
        expect(filePath).not.toContain('node_modules');
      }
    });
  });

  describe('compareSnapshots', () => {
    it('should detect created files', () => {
      const before = createSnapshot(testDir);

      // Create a new file
      fs.writeFileSync(path.join(testDir, 'new-file.txt'), 'new content');

      const after = createSnapshot(testDir);
      const changes = compareSnapshots(before, after);

      expect(changes.filesCreated).toContain('new-file.txt');
      expect(changes.filesModified).toHaveLength(0);
      expect(changes.filesDeleted).toHaveLength(0);
    });

    it('should detect modified files', () => {
      // Create initial file
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'original content');
      const before = createSnapshot(testDir);

      // Modify the file
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'modified content');

      const after = createSnapshot(testDir);
      const changes = compareSnapshots(before, after);

      expect(changes.filesModified).toContain('file.txt');
      expect(changes.filesCreated).toHaveLength(0);
      expect(changes.filesDeleted).toHaveLength(0);
    });

    it('should detect deleted files', () => {
      // Create initial file
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');
      const before = createSnapshot(testDir);

      // Delete the file
      fs.unlinkSync(path.join(testDir, 'file.txt'));

      const after = createSnapshot(testDir);
      const changes = compareSnapshots(before, after);

      expect(changes.filesDeleted).toContain('file.txt');
      expect(changes.filesCreated).toHaveLength(0);
      expect(changes.filesModified).toHaveLength(0);
    });

    it('should detect multiple changes', () => {
      // Create initial files
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
      const before = createSnapshot(testDir);

      // Make changes
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'modified content1');
      fs.unlinkSync(path.join(testDir, 'file2.txt'));
      fs.writeFileSync(path.join(testDir, 'file3.txt'), 'new content3');

      const after = createSnapshot(testDir);
      const changes = compareSnapshots(before, after);

      expect(changes.filesModified).toContain('file1.txt');
      expect(changes.filesDeleted).toContain('file2.txt');
      expect(changes.filesCreated).toContain('file3.txt');
    });
  });
});
