const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Structured progress logging. Reports go to `metrics.json`; logs are for humans
 * and for `--json` consumers, and never feed back into the deterministic metrics.
 */
export function createLogger({ json = false, level = "info", stream = process.stderr } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const emit = (name, message, fields = {}) => {
    if (LEVELS[name] < threshold) return;
    if (json) {
      stream.write(`${JSON.stringify({ level: name, message, ...fields })}\n`);
      return;
    }
    const detail = Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join(" ");
    stream.write(`[copyui] ${message}${detail ? ` · ${detail}` : ""}\n`);
  };

  return {
    debug: (message, fields) => emit("debug", message, fields),
    info: (message, fields) => emit("info", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    error: (message, fields) => emit("error", message, fields),
  };
}

export const nullLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};
