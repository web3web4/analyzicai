import { BaseAIProvider, AIProviderConfig } from "../base-provider";
import { AnalysisResult, analysisResultSchema } from "../types";

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
    this.model = config.model || "gpt-4o";
  }

  private async callVisionAPI(
    systemPrompt: string,
    userPrompt: string,
    imageBase64: string,
  ): Promise<{ content: string; tokensUsed: number }> {
    const messages: OpenAIVisionMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
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
        max_tokens: 4096,
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

Synthesize these analyses into a final, comprehensive result. Resolve any disagreements between providers, and provide weighted scores based on the consensus. Highlight areas of high agreement and areas where providers significantly disagreed.`;

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
