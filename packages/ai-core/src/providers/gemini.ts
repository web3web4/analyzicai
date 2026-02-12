import { z } from "zod";
import { BaseAnalysisResult } from "../types";
import { BaseAIProvider, AIProviderConfig } from "../base-provider";

export class GeminiProvider<
  TResult extends BaseAnalysisResult,
> extends BaseAIProvider<TResult> {
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model: string;

  constructor(config: AIProviderConfig, schema: z.ZodSchema<TResult>) {
    super("gemini", config, schema);

    // Determine model from tier selection or explicit model override
    if (config.model) {
      this.model = config.model;
    } else {
      const tier = config.modelTier || "tier1"; // Default to cheapest tier
      const tierMap = {
        tier1: process.env.GEMINI_MODEL_TIER_1,
        tier2: process.env.GEMINI_MODEL_TIER_2,
        tier3: process.env.GEMINI_MODEL_TIER_3,
      };

      this.model = tierMap[tier] || "";
    }

    if (!this.model) {
      throw new Error(
        `Gemini model not configured. Set GEMINI_MODEL_TIER_1, GEMINI_MODEL_TIER_2, and GEMINI_MODEL_TIER_3 environment variables in your environment configuration (e.g. .env, .env.local, or your deployment settings).`,
      );
    }
  }

  protected async callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }> {
    const parts: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [{ text: userPrompt }];

    // Add images if provided
    if (imagesBase64 && imagesBase64.length > 0) {
      imagesBase64.forEach((imageBase64) => {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Invalid base64 image format");
        }
        const [, mimeType, base64Data] = matches;
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      });
    }

    const contents = [{ parts }];

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { totalTokenCount?: number };
    };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { content, tokensUsed };
  }
}
