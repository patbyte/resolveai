type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, boolean | number | string | undefined>;

export function logEvent(
  level: LogLevel,
  event: string,
  context: LogContext = {},
  error?: unknown
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
    ...(error instanceof Error ? { errorType: error.name } : {})
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}
