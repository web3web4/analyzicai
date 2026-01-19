import { BaseAIProvider, AIProviderConfig } from "../base-provider";
import { AnalysisResult, analysisResultSchema } from "../types";

export class GeminiProvider extends BaseAIProvider {
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model: string;

  constructor(config: AIProviderConfig) {
    super("gemini", config);
    this.model = config.model || "gemini-2.0-flash";
  }

  private async callVisionAPI(
    systemPrompt: string,
    userPrompt: string,
    imageBase64: string,
  ): Promise<{ content: string; tokensUsed: number }> {
    // Extract base64 data and mime type
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 image format");
    }
    const [, mimeType, base64Data] = matches;

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [
                { text: userPrompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
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

  async analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const { content, tokensUsed } = await this.callVisionAPI(
      systemPrompt,
      userPrompt,
      imageBase64,
    );

    const parsed = JSON.parse(content);
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  async rethink(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
    previousResult: AnalysisResult,
    otherResults: AnalysisResult[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const enhancedPrompt = `${userPrompt}

## Your Previous Analysis
${JSON.stringify(previousResult, null, 2)}

## Other AI Perspectives
${otherResults.map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`).join("\n\n")}

Based on these other perspectives, reconsider your analysis. Where do you agree or disagree? Provide your revised assessment.`;

    const { content, tokensUsed } = await this.callVisionAPI(
      systemPrompt,
      enhancedPrompt,
      imageBase64,
    );

    const parsed = JSON.parse(content);
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  async synthesize(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
    allResults: AnalysisResult[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const synthesisPrompt = `${userPrompt}

## All Provider Analyses (v2 Rethink Phase)
${allResults.map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`).join("\n\n")}

Synthesize these analyses into a final, comprehensive result. Resolve any disagreements between providers, and provide weighted scores based on the consensus.`;

    const { content, tokensUsed } = await this.callVisionAPI(
      systemPrompt,
      synthesisPrompt,
      imageBase64,
    );

    const parsed = JSON.parse(content);
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }
}
