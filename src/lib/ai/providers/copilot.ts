import { BaseAIProvider, AIProviderConfig } from "../base-provider";

interface CopilotMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
}

export class CopilotProvider extends BaseAIProvider {
  private baseUrl = "https://api.githubcopilot.com/chat/completions";
  private model: string;

  constructor(config: AIProviderConfig) {
    super("copilot", config);
    this.model = config.model || "gpt-4o";
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

    const messages: CopilotMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userContent,
      },
    ];

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "Editor-Version": "vscode/1.86.0",
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
      throw new Error(
        `GitHub Copilot API error: ${response.status} - ${error}`,
      );
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
