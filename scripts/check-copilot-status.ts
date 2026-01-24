#!/usr/bin/env tsx

/**
 * Check Copilot SDK Status
 */

async function main() {
  console.log("🔍 Checking Copilot SDK Status...\n");

  try {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const path = await import("path");

    const cliPath = path.join(process.cwd(), "scripts/copilot-wrapper.sh");
    const client = new CopilotClient({ cliPath });

    console.log("📡 Starting Copilot CLI...");
    await client.start();

    console.log("✅ Copilot CLI started\n");

    // Check auth status
    console.log("🔐 Checking authentication status...");
    const authStatus = await client.getAuthStatus();
    console.log("Auth Status:", JSON.stringify(authStatus, null, 2));
    console.log();

    // Check general status
    console.log("📊 Checking Copilot status...");
    const status = await client.getStatus();
    console.log("Status:", JSON.stringify(status, null, 2));
    console.log();

    // List available models
    console.log("🤖 Checking available models...");
    const models = await client.listModels();
    console.log("Available Models:");
    models.forEach((model: any) => {
      console.log(`  - ${model.id}: ${model.name || "N/A"}`);
      if (model.capabilities) {
        console.log(`    Capabilities: ${JSON.stringify(model.capabilities)}`);
      }
    });
    console.log();

    console.log("🧹 Stopping client...");
    await client.stop();
    console.log("✅ Complete!");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);
