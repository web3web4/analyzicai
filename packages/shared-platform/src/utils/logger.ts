/**
 * Structured logging utility
 * Provides log levels with environment-based filtering
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get the current log level from environment
 * Defaults to 'info' in production, 'debug' in development
 */
function getCurrentLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;

  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }

  // Default: debug in dev, info in production
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const currentLevel = getCurrentLogLevel();
const currentLevelValue = LOG_LEVELS[currentLevel];

/**
 * Structured logger with log levels
 *
 * Usage:
 * ```ts
 * import { logger } from "@web3web4/shared-platform/utils/logger";
 *
 * logger.debug("User action", { userId: "123", action: "login" });
 * logger.info("Analysis completed", { analysisId, duration: 1234 });
 * logger.warn("Rate limit approaching", { userId, remaining: 10 });
 * logger.error("Database query failed", error);
 * ```
 *
 * Configure via environment:
 * ```env
 * LOG_LEVEL=debug   # Show everything
 * LOG_LEVEL=info    # Show info, warn, error
 * LOG_LEVEL=warn    # Show warn, error
 * LOG_LEVEL=error   # Show only errors
 * ```
 */
export const logger = {
  /**
   * Debug-level logging (verbose, development only)
   */
  debug: (message: string, meta?: object | Error) => {
    if (currentLevelValue <= LOG_LEVELS.debug) {
      const metaStr = meta
        ? typeof meta === "object" && "message" in meta
          ? meta.message
          : JSON.stringify(meta)
        : "";
      console.debug(`[DEBUG] ${message}`, metaStr);
    }
  },

  /**
   * Info-level logging (general application flow)
   */
  info: (message: string, meta?: object) => {
    if (currentLevelValue <= LOG_LEVELS.info) {
      const metaStr = meta ? JSON.stringify(meta) : "";
      console.log(`[INFO] ${message}`, metaStr);
    }
  },

  /**
   * Warning-level logging (potential issues)
   */
  warn: (message: string, meta?: object) => {
    if (currentLevelValue <= LOG_LEVELS.warn) {
      const metaStr = meta ? JSON.stringify(meta) : "";
      console.warn(`[WARN] ${message}`, metaStr);
    }
  },

  /**
   * Error-level logging (always logged)
   */
  error: (message: string, error?: Error | object | unknown) => {
    const errorInfo =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error
        ? JSON.stringify(error)
        : "";
    console.error(`[ERROR] ${message}`, errorInfo);
  },
};

/**
 * Create a logger with a specific prefix/context
 *
 * Usage:
 * ```ts
 * const log = createLogger("AnalysisAPI");
 * log.info("Starting analysis"); // Outputs: [INFO] [AnalysisAPI] Starting analysis
 * ```
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, meta?: object | Error) =>
      logger.debug(`[${context}] ${message}`, meta),
    info: (message: string, meta?: object) =>
      logger.info(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: object) =>
      logger.warn(`[${context}] ${message}`, meta),
    error: (message: string, error?: Error | object | unknown) =>
      logger.error(`[${context}] ${message}`, error),
  };
}
