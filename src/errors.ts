/**
 * Custom error classes for the agent-conformance tool
 */

export class ConformanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConformanceError';
    Object.setPrototypeOf(this, ConformanceError.prototype);
  }
}

export class ScanError extends ConformanceError {
  constructor(message: string) {
    super(message);
    this.name = 'ScanError';
  }
}

export class RuntimeError extends ConformanceError {
  constructor(message: string, public runtime?: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export class ConfigError extends ConformanceError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ReportError extends ConformanceError {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}
