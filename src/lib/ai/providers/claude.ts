import { BaseAIProvider, AIProviderConfig } from "../base-provider";
import { AnalysisResult, analysisResultSchema } from "../types";

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
    this.model = config.model || "claude-sonnet-4-20250514";
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
    const [, mediaType, data] = matches;

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data,
            },
          },
          {
            type: "text",
            text: userPrompt,
          },
        ],
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

    const data_response = await response.json();
    const content = data_response.content?.[0]?.text || "";
    const tokensUsed =
      (data_response.usage?.input_tokens || 0) +
      (data_response.usage?.output_tokens || 0);

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
      userPrompt + "\n\nRespond with valid JSON only.",
      imageBase64,
    );

    // Claude may return markdown-wrapped JSON, extract it
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      content,
    ];
    const jsonContent = jsonMatch[1]?.trim() || content;

    const parsed = JSON.parse(jsonContent);
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

Based on these other perspectives, reconsider your analysis. Where do you agree or disagree? Provide your revised assessment.

Respond with valid JSON only.`;

    const { content, tokensUsed } = await this.callVisionAPI(
      systemPrompt,
      enhancedPrompt,
      imageBase64,
    );

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      content,
    ];
    const jsonContent = jsonMatch[1]?.trim() || content;

    const parsed = JSON.parse(jsonContent);
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

Synthesize these analyses into a final, comprehensive result. Resolve any disagreements between providers, and provide weighted scores based on the consensus.

Respond with valid JSON only.`;

    const { content, tokensUsed } = await this.callVisionAPI(
      systemPrompt,
      synthesisPrompt,
      imageBase64,
    );

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      content,
    ];
    const jsonContent = jsonMatch[1]?.trim() || content;

    const parsed = JSON.parse(jsonContent);
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
