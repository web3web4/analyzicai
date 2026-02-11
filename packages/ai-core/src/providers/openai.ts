import { z } from "zod";
import { BaseAnalysisResult } from "../types";
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

export class OpenAIProvider<
  TResult extends BaseAnalysisResult,
> extends BaseAIProvider<TResult> {
  private baseUrl = "https://api.openai.com/v1";
  private model: string;

  constructor(config: AIProviderConfig, schema: z.ZodSchema<TResult>) {
    super("openai", config, schema);

    // Determine model from tier selection or explicit model override
    if (config.model) {
      this.model = config.model;
    } else {
      const tier = config.modelTier || "tier2"; // Default to moderate tier
      const tierMap = {
        tier1: process.env.OPENAI_MODEL_TIER_1,
        tier2: process.env.OPENAI_MODEL_TIER_2,
        tier3: process.env.OPENAI_MODEL_TIER_3,
      };

      this.model = tierMap[tier] || "";
    }

    if (!this.model) {
      throw new Error(
        `OpenAI model not configured. Set OPENAI_MODEL_TIER_1, OPENAI_MODEL_TIER_2, and OPENAI_MODEL_TIER_3 environment variables in your environment configuration (e.g. .env, .env.local, or your deployment settings).`,
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

    // OpenAI vision models don't support response_format when images are present
    // Only use json_object mode when there are no images
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages,
      max_completion_tokens: 8192,
    };

    // Only add response_format if no images (vision models don't support it)
    if (!imagesBase64 || imagesBase64.length === 0) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content || "",
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
