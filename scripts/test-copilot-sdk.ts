#!/usr/bin/env tsx

/**
 * Test Copilot SDK in Production-like Environment
 *
 * This script simulates how Copilot SDK will be used in production.
 * Run with: npx tsx scripts/test-copilot-sdk.ts
 *
 * Prerequisites:
 * - GitHub CLI authenticated: gh auth login
 * - Copilot CLI installed: gh copilot --version
 */

import { CopilotSDKProvider } from "../src/lib/ai/providers/copilot-sdk";

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

async function main() {
  console.log("=".repeat(80));
  console.log("🤖 Testing GitHub Copilot SDK in Production-like Environment");
  console.log("=".repeat(80));
  console.log();

  const provider = new CopilotSDKProvider({
    apiKey: "", // Not used by SDK - uses gh CLI auth
  });

  try {
    console.log("📡 Initializing Copilot SDK...");
    console.log("   (This will start the Copilot CLI in server mode)");
    console.log();

    const startTime = Date.now();

    console.log("💬 Sending analysis request...");
    const result = await provider.analyze(
      SYSTEM_PROMPT,
      `Analyze this HTML page:\n\n${SIMPLE_HTML}`,
    );

    const duration = Date.now() - startTime;

    console.log();
    console.log("✅ SUCCESS! Copilot SDK responded");
    console.log("=".repeat(80));
    console.log();
    console.log("📊 Results:");
    console.log(`   Provider: ${result.result.provider}`);
    console.log(`   Overall Score: ${result.result.overallScore}/100`);
    console.log(`   Latency: ${result.latencyMs}ms (${duration}ms total)`);
    console.log(`   Tokens Used: ${result.tokensUsed}`);
    console.log();
    console.log("📝 Categories:");
    Object.entries(result.result.categories).forEach(
      ([category, data]: [string, any]) => {
        console.log(`   ${category}: ${data.score}/100`);
      },
    );
    console.log();
    console.log("💡 Recommendations:");
    result.result.recommendations.forEach((rec: any, idx: number) => {
      console.log(`   ${idx + 1}. [${rec.severity}] ${rec.title}`);
    });
    console.log();
    console.log("📋 Summary:");
    console.log(`   ${result.result.summary}`);
    console.log();
    console.log("=".repeat(80));
    console.log("✨ Copilot SDK is working perfectly in production mode!");
    console.log("=".repeat(80));
  } catch (error) {
    console.error();
    console.error("❌ ERROR:");
    console.error(error);
    console.error();
    console.error("💡 Troubleshooting:");
    console.error("   1. Ensure GitHub CLI is authenticated: gh auth login");
    console.error(
      "   2. Ensure Copilot CLI is installed: gh copilot --version",
    );
    console.error("   3. Ensure you have an active Copilot subscription");
    console.error();
    process.exit(1);
  } finally {
    console.log();
    console.log("🧹 Cleaning up...");
    try {
      await provider.dispose();
      console.log("✅ Cleanup complete");
    } catch (error) {
      console.error("⚠️  Cleanup warning (non-critical):", error);
    }
  }
}

// Run the test
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
