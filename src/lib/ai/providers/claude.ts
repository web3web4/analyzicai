import { BaseAIProvider, AIProviderConfig } from "../base-provider";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: Array<{
    type: "text" | "image";
    text?: string;
    source?: {
      type: "base64";
      media_type: string;
      data: string;
    };
  }>;
}

export class ClaudeProvider extends BaseAIProvider {
  private baseUrl = "https://api.anthropic.com/v1";
  private model: string;

  constructor(config: AIProviderConfig) {
    super("claude", config);

    // Determine model from environment-specific variables
    const isProduction = process.env.NODE_ENV === "production";
    this.model =
      config.model ||
      (isProduction
        ? process.env.ANTHROPIC_MODEL_FOR_PRODUCTION
        : process.env.ANTHROPIC_MODEL_FOR_TESTING) ||
      "";

    if (!this.model) {
      throw new Error(
        `Claude model not configured. Set ${isProduction ? "ANTHROPIC_MODEL_FOR_PRODUCTION" : "ANTHROPIC_MODEL_FOR_TESTING"} in .env.local`,
      );
    }
  }

  protected async callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64: string[],
  ): Promise<{ content: string; tokensUsed: number }> {
    const imagesContent: ClaudeMessage["content"] = [];
    if (imagesBase64) {
      imagesBase64.forEach((imageBase64) => {
        // Extract base64 data and mime type
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Invalid base64 image format");
        }
        const [, mediaType, data] = matches;
        imagesContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data,
          },
        });
      });
    }
    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: imagesContent.concat([
          {
            type: "text",
            text: userPrompt,
          },
        ]),
      },
    ];

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const tokensUsed =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return { content, tokensUsed };
  }

  protected parseResponseContent(content: string): unknown {
    // Claude may return markdown-wrapped JSON, extract it
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      content,
    ];
    const jsonContent = jsonMatch[1]?.trim() || content;
    return JSON.parse(jsonContent);
  }
}
