type ErrorContext = Record<string, unknown>;

export function reportAppError(_error: unknown, _context: ErrorContext = {}) {
  // Optional hook for a custom logger or telemetry service.
}

export const reportLovableError = reportAppError;
