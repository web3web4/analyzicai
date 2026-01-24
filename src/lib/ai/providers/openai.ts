import { BaseAIProvider, AIProviderConfig } from "../base-provider";

interface OpenAIVisionMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
}

export class OpenAIProvider extends BaseAIProvider {
  private baseUrl = "https://api.openai.com/v1";
  private model: string;

  constructor(config: AIProviderConfig) {
    super("openai", config);

    // Determine model from environment-specific variables
    const isProduction = process.env.NODE_ENV === "production";
    this.model =
      config.model ||
      (isProduction
        ? process.env.OPENAI_MODEL_FOR_PRODUCTION
        : process.env.OPENAI_MODEL_FOR_TESTING) ||
      "";

    if (!this.model) {
      throw new Error(
        `OpenAI model not configured. Set the ${isProduction ? "OPENAI_MODEL_FOR_PRODUCTION" : "OPENAI_MODEL_FOR_TESTING"} environment variable in your environment configuration (e.g. .env, .env.local, or your deployment settings).`,
      );
    }
  }

  protected async callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }> {
    const userContent: Array<{
      type: "text" | "image_url";
      text?: string;
      image_url?: { url: string };
    }> = [{ type: "text", text: userPrompt }];

    // Add images if provided
    if (imagesBase64 && imagesBase64.length > 0) {
      imagesBase64.forEach((imageBase64) => {
        userContent.push({
          type: "image_url",
          image_url: { url: imageBase64 },
        });
      });
    }

    const messages: OpenAIVisionMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userContent,
      },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_completion_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
