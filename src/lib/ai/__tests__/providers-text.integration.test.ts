import { describe, it, expect } from "@jest/globals";
import { OpenAIProvider } from "../providers/openai";
import { AnthropicProvider } from "../providers/anthropic";
import { GeminiProvider } from "../providers/gemini";

/**
 * Integration tests for text-only analysis (code review use case)
 *
 * These tests require actual API keys set in environment variables:
 * - OPENAI_API_KEY
 * - ANTHROPIC_API_KEY
 * - GEMINI_API_KEY
 *
 * To run: npm test -- providers-text.integration.test.ts
 */

const SYSTEM_PROMPT = `You are a UI/UX analysis assistant. Analyze the provided content and return a JSON object with:
{
  "provider": "provider-name",
  "overallScore": <number 0-100>,
  "categories": {
    "colorContrast": { "score": <number 0-100>, "observations": ["..."] },
    "typography": { "score": <number 0-100>, "observations": ["..."] },
    "layoutComposition": { "score": <number 0-100>, "observations": ["..."] },
    "navigation": { "score": <number 0-100>, "observations": ["..."] },
    "accessibility": { "score": <number 0-100>, "observations": ["..."] },
    "visualHierarchy": { "score": <number 0-100>, "observations": ["..."] },
    "whitespace": { "score": <number 0-100>, "observations": ["..."] },
    "consistency": { "score": <number 0-100>, "observations": ["..."] }
  },
  "recommendations": [
    { "severity": "low|medium|high|critical", "category": "...", "title": "...", "description": "..." }
  ],
  "summary": "..."
}`;

const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Simple Page</title>
</head>
<body>
  <h1>Welcome</h1>
  <p>This is a simple test page.</p>
  <button>Click Me</button>
</body>
</html>
`;

describe("Text-Only Analysis Integration Tests", () => {
  // Skip tests if API keys not available
  const skipIfNoKey = (key: string) => {
    if (!process.env[key]) {
      console.log(`Skipping test: ${key} not set`);
      return true;
    }
    return false;
  };

  describe("OpenAI Provider", () => {
    it("should analyze code without image", async () => {
      if (skipIfNoKey("OPENAI_API_KEY")) return;

      const provider = new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const result = await provider.analyze(
        SYSTEM_PROMPT,
        `Analyze this HTML page:\n\n${SIMPLE_HTML}`,
      );

      expect(result.result.provider).toBe("openai");
      expect(result.result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.result.overallScore).toBeLessThanOrEqual(100);
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.latencyMs).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Claude Provider", () => {
    it("should analyze code without image", async () => {
      if (skipIfNoKey("ANTHROPIC_API_KEY")) return;

      const provider = new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });

      const result = await provider.analyze(
        SYSTEM_PROMPT,
        `Analyze this HTML page:\n\n${SIMPLE_HTML}`,
      );

      expect(result.result.provider).toBe("anthropic");
      expect(result.result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.result.overallScore).toBeLessThanOrEqual(100);
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.latencyMs).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Gemini Provider", () => {
    it("should analyze code without image", async () => {
      if (skipIfNoKey("GEMINI_API_KEY")) return;

      const provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY!,
      });

      const result = await provider.analyze(
        SYSTEM_PROMPT,
        `Analyze this HTML page:\n\n${SIMPLE_HTML}`,
      );

      expect(result.result.provider).toBe("gemini");
      expect(result.result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.result.overallScore).toBeLessThanOrEqual(100);
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.latencyMs).toBeGreaterThan(0);
    }, 30000);
  });
});
