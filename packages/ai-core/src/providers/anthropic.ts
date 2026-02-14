import { z } from "zod";
import { BaseAnalysisResult } from "../types";
import { BaseAIProvider, AIProviderConfig } from "../base-provider";

interface AnthropicMessage {
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

export class AnthropicProvider<
  TResult extends BaseAnalysisResult,
> extends BaseAIProvider<TResult> {
  private baseUrl = "https://api.anthropic.com/v1";
  private model: string;
  private maxTokens: number;

  constructor(config: AIProviderConfig, schema: z.ZodSchema<TResult>) {
    super("anthropic", config, schema);

    // Determine model from tier selection or explicit model override
    if (config.model) {
      this.model = config.model;
    } else {
      const tier = config.modelTier || "tier1"; // Default to cheapest tier
      const tierMap = {
        tier1: process.env.ANTHROPIC_MODEL_TIER_1,
        tier2: process.env.ANTHROPIC_MODEL_TIER_2,
        tier3: process.env.ANTHROPIC_MODEL_TIER_3,
      };

      this.model = tierMap[tier] || "";
    }

    if (!this.model) {
      throw new Error(
        `Anthropic model not configured. Set ANTHROPIC_MODEL_TIER_1, ANTHROPIC_MODEL_TIER_2, and ANTHROPIC_MODEL_TIER_3 environment variables in your environment configuration (e.g. .env, .env.local, or your deployment settings).`,
      );
    }

    // Set max tokens based on model capabilities
    // Increased limits to support large synthesis responses with multiple images
    // All models now support up to 16384 tokens output
    if (this.model.includes("haiku")) {
      this.maxTokens = 16384;
    } else if (this.model.includes("sonnet")) {
      this.maxTokens = 16384;
    } else {
      this.maxTokens = 16384; // Default safe value
    }
  }

  protected async callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }> {
    const imagesContent: AnthropicMessage["content"] = [];
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
    const messages: AnthropicMessage[] = [
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
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const content = data.content?.[0]?.text || "";
    const tokensUsed =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return { content, tokensUsed };
  }
}
