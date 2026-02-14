import path from "node:path";
import type { NextConfig } from "next";
import { loadRootEnv } from "@web3web4/shared-platform/config/env";

const repoRoot = path.resolve(__dirname, "../..");
// Load env files if they exist (dev), but don't throw on Vercel/production
loadRootEnv({ rootDir: repoRoot, throwIfMissing: false });

const nextConfig: NextConfig = {
  // Expose model tier env vars to the client bundle
  // These are needed for the UI to display model names
  env: {
    OPENAI_MODEL_TIER_1: process.env.OPENAI_MODEL_TIER_1,
    OPENAI_MODEL_TIER_2: process.env.OPENAI_MODEL_TIER_2,
    OPENAI_MODEL_TIER_3: process.env.OPENAI_MODEL_TIER_3,
    ANTHROPIC_MODEL_TIER_1: process.env.ANTHROPIC_MODEL_TIER_1,
    ANTHROPIC_MODEL_TIER_2: process.env.ANTHROPIC_MODEL_TIER_2,
    ANTHROPIC_MODEL_TIER_3: process.env.ANTHROPIC_MODEL_TIER_3,
    GEMINI_MODEL_TIER_1: process.env.GEMINI_MODEL_TIER_1,
    GEMINI_MODEL_TIER_2: process.env.GEMINI_MODEL_TIER_2,
    GEMINI_MODEL_TIER_3: process.env.GEMINI_MODEL_TIER_3,
  },
};

export default nextConfig;
