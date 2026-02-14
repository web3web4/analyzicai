/**
 * CORS (Cross-Origin Resource Sharing) middleware utilities
 * Provides safe cross-origin request handling
 */

import { NextResponse, type NextRequest } from "next/server";

/**
 * Allowed origins for CORS requests
 * Add your production domains here
 */
const ALLOWED_ORIGINS = [
  "https://uxic.ai",
  "https://app.uxic.ai",
  "https://solidic.ai",
  "https://app.solidic.ai",
  // Development environments
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
      ]
    : []),
];

/**
 * Generate CORS headers for a given origin
 * Returns empty object if origin is not allowed
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {}; // No CORS headers for unauthorized origins
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Add CORS headers to a NextResponse
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData();
 *   const response = NextResponse.json(data);
 *   return withCors(response, request);
 * }
 * ```
 */
export function withCors(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle OPTIONS preflight requests
 *
 * Usage:
 * ```ts
 * export async function OPTIONS(request: NextRequest) {
 *   return handleCorsPreFlight(request);
 * }
 * ```
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Check if a request origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  return origin !== null && ALLOWED_ORIGINS.includes(origin);
}
