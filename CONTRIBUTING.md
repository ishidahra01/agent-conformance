# Contributing to agent-conformance

Thank you for your interest in contributing to `agent-conformance`!

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ishidahra01/agent-conformance.git
   cd agent-conformance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Development Workflow

#### Building

The project uses TypeScript. To build:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run dev
```

#### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

#### Linting and Formatting

Lint the code:

```bash
npm run lint
```

Format the code:

```bash
npm run format
```

#### Running the CLI Locally

After building, you can run the CLI:

```bash
node dist/cli.js --help
```

Or using npm:

```bash
npm run cli -- --help
```

To install globally for local development:

```bash
npm link
agent-conformance --help
```

## Project Structure

```
agent-conformance/
├── src/
│   ├── adapters/        # Runtime adapters (Claude, Codex, etc.)
│   ├── conformance/     # Conformance engine and rule evaluation
│   ├── reporter/        # Report generation (JSON, Markdown, HTML)
│   ├── scanner/         # Repo asset discovery and parsing
│   ├── cli.ts           # CLI entrypoint
│   ├── types.ts         # TypeScript type definitions
│   ├── logger.ts        # Logging configuration
│   └── errors.ts        # Custom error classes
├── dist/                # Compiled JavaScript (generated)
├── tests/               # Test files (co-located with source)
└── out/                 # Report output directory (generated)
```

## Adding New Features

### Adding a New Runtime Adapter

1. Create a new file in `src/adapters/` (e.g., `my-runtime-adapter.ts`)
2. Implement the `RuntimeAdapter` interface
3. Export from `src/adapters/index.ts`
4. Add tests in `src/adapters/my-runtime-adapter.test.ts`

Example:

```typescript
import { RuntimeAdapter, ExecutionOptions } from './runtime-adapter';
import { RuntimeType, ExecutionTrace } from '../types';

export class MyRuntimeAdapter implements RuntimeAdapter {
  getRuntime(): RuntimeType {
    // Return your runtime type
  }

  async execute(
    repoPath: string,
    task: string,
    options?: ExecutionOptions
  ): Promise<ExecutionTrace> {
    // Implement execution logic
  }

  async isAvailable(): Promise<boolean> {
    // Check if runtime is available
  }
}
```

### Adding New Conformance Rules

1. Edit `src/conformance/engine.ts`
2. Add rule logic in the `evaluateTrace` method
3. Add tests in `src/conformance/engine.test.ts`

### Adding New Report Formats

1. Edit `src/reporter/reporter.ts`
2. Add new format to `ReportFormat` enum
3. Implement generation method
4. Add tests in `src/reporter/reporter.test.ts`

## Testing

### Unit Tests

We use Jest for testing. Tests are co-located with source files using the `.test.ts` suffix.

Example test:

```typescript
import { RepoScanner } from './repo-scanner';

describe('RepoScanner', () => {
  it('should scan repository', async () => {
    const scanner = new RepoScanner('/path/to/repo');
    const assets = await scanner.scan();
    expect(assets).toBeDefined();
  });
});
```

### Integration Tests

For integration tests that require a real repository structure, create fixtures in a `__fixtures__` directory.

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs

## Commit Messages

Use conventional commit format:

- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `test: Add or update tests`
- `refactor: Refactor code`
- `chore: Update build process or dependencies`

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes
6. Push to your fork
7. Open a Pull Request

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

## Architecture Notes

### Module Boundaries

The project is organized into clear modules:

1. **Scanner**: Discovers and parses repo assets
   - Input: Repository path
   - Output: Normalized `RepoAssets` object

2. **Adapters**: Execute tasks in different runtimes
   - Input: Repository path, task name
   - Output: `ExecutionTrace` with metadata

3. **Conformance Engine**: Evaluates traces against policy
   - Input: Execution traces, policy config
   - Output: `ConformanceResult` with violations

4. **Reporter**: Generates human-readable reports
   - Input: Conformance result
   - Output: Report files (JSON/MD/HTML)

### Adding Runtime Support

To add a new runtime:

1. Implement `RuntimeAdapter` interface
2. Ensure the adapter can:
   - Execute tasks in the runtime
   - Capture file operations
   - Collect tool/MCP usage
   - Track approval events
   - Report outcome and metrics

3. The adapter should work with user's existing setup (no managed runtime)

### Extensibility

The normalized IR (`RepoAssets`, `ExecutionTrace`) is designed to be runtime-agnostic. When adding support for new runtimes or asset types:

- Extend types in `src/types.ts` if needed
- Keep the core IR compatible
- Add runtime-specific details as optional fields
- Document any runtime-specific behavior

## Questions?

Open an issue or discussion on GitHub if you have questions or need help.

Thank you for contributing!
