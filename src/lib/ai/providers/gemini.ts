import { BaseAIProvider, AIProviderConfig } from "../base-provider";

export class GeminiProvider extends BaseAIProvider {
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model: string;

  constructor(config: AIProviderConfig) {
    super("gemini", config);
    this.model = config.model || "gemini-2.0-flash";
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
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { content, tokensUsed };
  }
}
