import { describe, it, expect } from "@jest/globals";
import { CopilotSDKProvider } from "../providers/copilot-sdk";

/**
 * Copilot SDK Integration Test (ESM mode)
 *
 * This test runs separately with jest.config.esm.mjs to support pure ESM modules
 * Run with: pnpm test:copilot
 *
 * Prerequisites:
 * - GitHub CLI authenticated: gh auth login
 * - Copilot CLI installed: gh copilot --version
 * - Copilot SDK installed: pnpm add @github/copilot-sdk
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

describe("GitHub Copilot SDK Provider (ESM)", () => {
  it("should analyze HTML without image using Copilot SDK", async () => {
    // SDK uses gh CLI authentication
    const provider = new CopilotSDKProvider({
      apiKey: "", // Not used by SDK
    });

    const result = await provider.analyze(
      SYSTEM_PROMPT,
      `Analyze this HTML page:\n\n${SIMPLE_HTML}`,
    );

    // Verify response structure
    expect(result.result.provider).toBe("copilot");
    expect(result.result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.result.overallScore).toBeLessThanOrEqual(100);
    expect(result.result.categories).toBeDefined();
    expect(result.result.summary).toBeDefined();
    expect(result.latencyMs).toBeGreaterThan(0);

    // Clean up
    await provider.dispose();
  }, 90000);
});
