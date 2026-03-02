import type { NextConfig } from "next";

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
