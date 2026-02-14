/**
 * Error handling utilities
 * Provides safe error responses that don't leak implementation details
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * Application error with separate user-facing and internal messages
 */
export class AppError extends Error {
  constructor(
    public userMessage: string, // Safe to show to users
    public internalMessage: string, // Detailed message for logs only
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>,
  ) {
    super(internalMessage);
    this.name = "AppError";
    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Common error types for convenience
 */
export class ValidationError extends AppError {
  constructor(userMessage: string, internalMessage?: string) {
    super(
      userMessage,
      internalMessage || userMessage,
      400, // Bad Request
    );
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(userMessage = "Authentication required") {
    super(userMessage, "User not authenticated", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(userMessage = "Access denied") {
    super(userMessage, "User not authorized for this action", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, `Resource not found: ${resource}`, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(resetAt?: Date) {
    super(
      "Rate limit exceeded. Please try again later.",
      `Rate limit exceeded${
        resetAt ? ` (resets at ${resetAt.toISOString()})` : ""
      }`,
      429,
    );
    this.name = "RateLimitError";
    if (resetAt) {
      this.metadata = { resetAt: resetAt.toISOString() };
    }
  }
}

/**
 * Handle API errors safely
 * Converts errors to appropriate HTTP responses without leaking details
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known AppError types
  if (error instanceof AppError) {
    logger.error(error.internalMessage, {
      statusCode: error.statusCode,
      metadata: error.metadata,
    });

    return NextResponse.json(
      {
        error: error.userMessage,
        ...(error.metadata && { metadata: error.metadata }),
      },
      { status: error.statusCode },
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error("Unexpected error", error);

    // Don't expose error details in production
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        ...(isDev && { details: error.message }),
      },
      { status: 500 },
    );
  }

  // Handle unknown errors
  logger.error("Unknown error type", { error });
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

/**
 * Safe error serialization for logging
 * Extracts useful information without circular references
 */
export function serializeError(error: unknown): object {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        userMessage: error.userMessage,
        metadata: error.metadata,
      }),
    };
  }

  if (typeof error === "object" && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { error: String(error) };
    }
  }

  return { error: String(error) };
}

/**
 * Authentication error messages
 */
export const AUTH_NETWORK_ERROR_MESSAGE =
  "🚫 Unable to connect to authentication service. Please disable your ad blocker especially if you are on `localhost` and try again.";

/**
 * Helper to detect network errors
 */
export const isNetworkError = (message: string) =>
  message === "Failed to fetch" ||
  message.includes("NetworkError") ||
  message.includes("Network request failed") ||
  message.includes("CORS") ||
  message.toLowerCase().includes("network");
