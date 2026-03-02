/**
 * Environment variable validation and access
 * Validates all required env vars at startup to fail fast
 *
 * NOTE: Env files are loaded by dotenv-cli in each app's package.json scripts
 * (e.g. "dotenv -e ../../.env.local -- next dev"). This module only validates
 * and provides typed access to already-loaded process.env vars.
 */

import { z } from "zod";

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE: z
    .string()
    .min(1, "Supabase publishable key is required"),
  SUPABASE_SECRET_KEY: z.string().min(1, "Supabase secret key is required"),

  // Encryption (required for API key storage)
  ENCRYPTION_KEY: z
    .string()
    .length(64, "Must be a 32-byte hex string (64 characters)")
    .regex(/^[0-9a-f]{64}$/i, "Must be a valid hex string"),

  // Admin Configuration (optional)
  ADMIN_EMAILS: z.string().optional(),

  // API Logging (optional - defaults to disabled)
  ENABLE_API_LOGGING: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),

  // AI Provider Keys (optional - users can bring their own)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // GitHub Token (optional - for solidicai GitHub loading)
  GITHUB_TOKEN: z.string().optional(),

  // AI Model Configuration (optional)
  OPENAI_MODEL_TIER_1: z.string().optional(),
  OPENAI_MODEL_TIER_2: z.string().optional(),
  OPENAI_MODEL_TIER_3: z.string().optional(),
  ANTHROPIC_MODEL_TIER_1: z.string().optional(),
  ANTHROPIC_MODEL_TIER_2: z.string().optional(),
  ANTHROPIC_MODEL_TIER_3: z.string().optional(),
  GEMINI_MODEL_TIER_1: z.string().optional(),
  GEMINI_MODEL_TIER_2: z.string().optional(),
  GEMINI_MODEL_TIER_3: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validate environment variables at application startup
 * Call this in your root layout or app initialization
 *
 * @throws Error if validation fails with detailed error messages
 * @returns Validated environment object
 */
export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(
      JSON.stringify(result.error.format(), null, 2)
        .split("\n")
        .slice(0, 50)
        .join("\n"),
    );
    throw new Error(
      "Environment validation failed. Check .env file and ensure all required variables are set.",
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Get validated environment variables
 * Must call validateEnv() first during app initialization
 *
 * @throws Error if validateEnv() has not been called
 * @returns Validated environment object
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    throw new Error(
      "Environment not validated. Call validateEnv() first in your app initialization.",
    );
  }
  return cachedEnv;
}

/**
 * Check if a specific environment variable is set
 */
export function hasEnv(key: keyof Env): boolean {
  const env = getEnv();
  return env[key] !== undefined && env[key] !== null && env[key] !== "";
}
