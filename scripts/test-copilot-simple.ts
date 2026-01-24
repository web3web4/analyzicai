#!/usr/bin/env tsx

/**
 * Simple Copilot SDK Test
 *
 * Test if Cop ilot SDK works with a simple conversational prompt
 */

import { CopilotSDKProvider } from "../src/lib/ai/providers/copilot-sdk";

async function main() {
  console.log("🤖 Testing GitHub Copilot SDK with simple prompt\n");

  const provider = new CopilotSDKProvider({
    apiKey: "",
  });

  try {
    console.log("💬 Asking Copilot a simple question...\n");

    const result = await provider.analyze(
      "You are a helpful coding assistant.",
      "Write a simple hello world function in JavaScript. Just respond with the code, no JSON.",
    );

    console.log("✅ SUCCESS!\n");
    console.log("Response:");
    console.log(result.result);
    console.log("\nLatency:", result.latencyMs, "ms");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  } finally {
    await provider.dispose();
  }
}

main().catch(console.error);
