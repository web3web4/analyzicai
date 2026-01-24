#!/usr/bin/env tsx

/**
 * Test Copilot SDK with event streaming
 */

async function main() {
  console.log("🤖 Testing Copilot SDK with event streaming\n");

  try {
    const { CopilotClient } = await import("@github/copilot-sdk");
    const path = await import("path");

    const cliPath = path.join(process.cwd(), "scripts/copilot-wrapper.sh");
    const client = new CopilotClient({ cliPath });

    await client.start();
    console.log("✅ Client started\n");

    const session = await client.createSession({
      model: "gpt-5.2-codex",
      systemMessage: {
        content: "You are a helpful coding assistant.",
      },
    });
    console.log("✅ Session created:", session.sessionId, "\n");

    // Listen to events
    let responseText = "";
    session.on((event: any) => {
      console.log("📨 Event:", event.type);

      if (event.type === "assistant.message") {
        console.log("✨ Assistant response:", event.data.content);
        responseText = event.data.content;
      } else if (event.type === "session.error") {
        console.error("❌ Session error:", event.data);
      } else if (event.type === "session.idle") {
        console.log("💤 Session idle");
      }
    });

    console.log("💬 Sending message...");
    await session.send({
      prompt:
        "Write a hello world function in JavaScript. Just the code, nothing else.",
    });

    // Wait a bit for events
    console.log("⏳ Waiting for response...\n");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("\n📋 Final response:", responseText || "No response");

    await session.destroy();
    await client.stop();
    console.log("\n✅ Complete!");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

main().catch(console.error);
