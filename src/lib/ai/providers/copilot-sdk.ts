import { BaseAIProvider, AIProviderConfig } from "../base-provider";

/**
 * GitHub Copilot provider using the official Copilot SDK
 *
 * Note: This uses the Copilot SDK which communicates with the Copilot CLI
 * via JSON-RPC. The CLI must be installed separately.
 *
 * Authentication: The SDK uses the GitHub CLI's authentication.
 * Run `gh auth login` to authenticate.
 *
 * This provider uses dynamic imports for ESM compatibility.
 */
export class CopilotSDKProvider extends BaseAIProvider {
  private client: any = null;
  private sdkModule: any = null;

  constructor(config: AIProviderConfig) {
    super("copilot", config);
    // Note: We don't use config.apiKey for SDK-based approach
    // The SDK uses gh CLI authentication instead
  }

  /**
   * Load the Copilot SDK using dynamic import (works in ESM)
   */
  private async loadSDK(): Promise<void> {
    if (this.sdkModule) return;

    try {
      // Dynamic import works in both CommonJS and ESM
      this.sdkModule = await import("@github/copilot-sdk");
    } catch (error) {
      throw new Error(
        `Failed to load Copilot SDK. Make sure it's installed: pnpm add @github/copilot-sdk\n` +
          `Also ensure GitHub CLI is authenticated: gh auth login\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Initialize the Copilot SDK client
   */
  private async initClient(): Promise<any> {
    if (this.client) {
      return this.client;
    }

    await this.loadSDK();

    // Create a new Copilot client
    // The SDK will automatically start the CLI in server mode
    const { CopilotClient } = this.sdkModule;

    // Use wrapper script to call 'gh copilot' since the binary isn't standalone
    const path = await import("path");
    const cliPath = path.join(process.cwd(), "scripts/copilot-wrapper.sh");

    this.client = new CopilotClient({
      cliPath,
    });

    return this.client;
  }

  protected async callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }> {
    const client = await this.initClient();
    let session: any = null;

    try {
      // Note: Image support in Copilot SDK may be limited
      if (imagesBase64 && imagesBase64.length > 0) {
        console.warn(
          "Warning: Image support via Copilot SDK may be limited. Check SDK docs.",
        );
      }

      console.log("[CopilotSDK] Creating session...");
      // Create a new session with system message
      // Using gpt-5.2-codex which is available in Copilot
      session = await client.createSession({
        model: "gpt-5.2-codex",
        systemMessage: {
          content: systemPrompt,
        },
      });
      console.log("[CopilotSDK] Session created:", session.sessionId);

      console.log("[CopilotSDK] Sending message and waiting for response...");
      // Send message and wait for completion with increased timeout
      const response = await session.sendAndWait(
        {
          prompt: userPrompt,
        },
        90000, // 90 second timeout
      );
      console.log("[CopilotSDK] Response received");

      // Extract content from the response
      const content = response?.data?.content || "";

      if (!content) {
        console.warn("[CopilotSDK] Empty response received");
        console.log(
          "[CopilotSDK] Full response:",
          JSON.stringify(response, null, 2),
        );
      }

      // Note: Token usage may not be available from SDK
      const tokensUsed = 0; // SDK may not provide this

      return {
        content,
        tokensUsed,
      };
    } catch (error) {
      console.error("[CopilotSDK] Error in callAPI:", error);
      throw new Error(
        `Copilot SDK error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      // Destroy the session
      if (session) {
        try {
          console.log("[CopilotSDK] Destroying session...");
          await session.destroy();
          console.log("[CopilotSDK] Session destroyed");
        } catch (error) {
          console.warn("[CopilotSDK] Error destroying session:", error);
        }
      }
    }
  }

  /**
   * Clean up resources when done
   */
  async dispose(): Promise<void> {
    if (this.client) {
      await this.client.stop();
      this.client = null;
    }
  }
}
