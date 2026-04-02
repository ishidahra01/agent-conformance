import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Tracks file system changes before and after execution
 */
export interface FileSnapshot {
  path: string;
  hash: string;
  exists: boolean;
}

export interface FileChanges {
  filesRead: string[];
  filesModified: string[];
  filesCreated: string[];
  filesDeleted: string[];
}

/**
 * Create a snapshot of all files in a directory
 */
export function createSnapshot(repoPath: string): Map<string, FileSnapshot> {
  const snapshot = new Map<string, FileSnapshot>();

  function walkDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(repoPath, fullPath);

      // Skip .git directory and node_modules
      if (relativePath.startsWith('.git') || relativePath.includes('node_modules')) {
        continue;
      }

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath);
          const hash = crypto.createHash('md5').update(content).digest('hex');
          snapshot.set(relativePath, {
            path: relativePath,
            hash,
            exists: true,
          });
        } catch (error) {
          // Skip files we can't read
        }
      }
    }
  }

  walkDir(repoPath);
  return snapshot;
}

/**
 * Compare two snapshots and determine changes
 */
export function compareSnapshots(
  before: Map<string, FileSnapshot>,
  after: Map<string, FileSnapshot>
): FileChanges {
  const filesModified: string[] = [];
  const filesCreated: string[] = [];
  const filesDeleted: string[] = [];
  const filesRead: string[] = [];

  // Check for modifications and deletions
  for (const [filePath, beforeSnap] of before.entries()) {
    const afterSnap = after.get(filePath);

    if (!afterSnap) {
      // File was deleted
      filesDeleted.push(filePath);
    } else if (beforeSnap.hash !== afterSnap.hash) {
      // File was modified
      filesModified.push(filePath);
    }
  }

  // Check for new files
  for (const [filePath, afterSnap] of after.entries()) {
    if (!before.has(filePath)) {
      filesCreated.push(filePath);
    }
  }

  return {
    filesRead,
    filesModified,
    filesCreated,
    filesDeleted,
  };
}
