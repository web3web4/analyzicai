import { AnalysisResult, analysisResultSchema } from "./types";
import * as fs from "fs";
import * as path from "path";

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

export abstract class BaseAIProvider {
  protected name: string;
  protected config: AIProviderConfig;
  private logDir?: string;

  constructor(name: string, config: AIProviderConfig) {
    this.name = name;
    this.config = config;

    // Set up logging directory if enabled via environment variable
    if (process.env.ENABLE_API_LOGGING === "true") {
      this.logDir = path.join(process.cwd(), "test-logs", name);
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    }
  }

  /**
   * Provider-specific API call implementation.
   * Each provider must implement this to handle their specific API format.
   * @param systemPrompt - System-level instructions
   * @param userPrompt - User's prompt/query
   * @param imagesBase64 - Optional array of base64-encoded images (empty array or undefined for text-only)
   */
  protected abstract callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }>;

  /**
   * Hook for parsing response content.
   * Override this if provider returns non-standard JSON (e.g., markdown-wrapped).
   * Default implementation: direct JSON parse.
   */
  protected parseResponseContent(content: string): unknown {
    return JSON.parse(content);
  }

  /**
   * Log API request and response to a dedicated folder with JSON, TXT, and image files
   */
  private logAPICall(
    methodName: string,
    request: {
      systemPrompt: string;
      userPrompt: string;
      imagesBase64?: string[];
      rawRequest?: unknown; // Raw API request object
    },
    response: {
      content: string;
      tokensUsed: number;
      latencyMs: number;
      rawResponse?: unknown; // Raw API response object
      error?: string;
    },
  ): void {
    if (!this.logDir) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const callFolderName = `${methodName}_${timestamp}`;
    const callDir = path.join(this.logDir, callFolderName);

    // Create dedicated folder for this API call
    if (!fs.existsSync(callDir)) {
      fs.mkdirSync(callDir, { recursive: true });
    }

    // Save input images if any
    const inputImagePaths: string[] = [];
    if (request.imagesBase64 && request.imagesBase64.length > 0) {
      request.imagesBase64.forEach((imageBase64, idx) => {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const [, mimeType, base64Data] = matches;
          const extension = mimeType.split("/")[1] || "png";
          const filename = `input_image_${idx + 1}.${extension}`;
          const imagePath = path.join(callDir, filename);

          // Write image binary data
          fs.writeFileSync(imagePath, Buffer.from(base64Data, "base64"));
          inputImagePaths.push(filename);
        }
      });
    }

    // JSON log with full data including raw request/response
    const logData = {
      provider: this.name,
      method: methodName,
      timestamp: new Date().toISOString(),
      request: {
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        imagesCount: request.imagesBase64?.length || 0,
        imageFiles: inputImagePaths,
        rawRequest: request.rawRequest,
      },
      response: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        latencyMs: response.latencyMs,
        rawResponse: response.rawResponse,
        error: response.error,
      },
    };

    fs.writeFileSync(
      path.join(callDir, "request.json"),
      JSON.stringify(logData, null, 2),
    );

    // TXT log with human-readable format
    let txtContent = "";
    txtContent += "=".repeat(80) + "\n";
    txtContent += `PROVIDER: ${this.name}\n`;
    txtContent += `METHOD: ${methodName}\n`;
    txtContent += `TIMESTAMP: ${new Date().toISOString()}\n`;
    txtContent += "=".repeat(80) + "\n\n";

    txtContent += "SYSTEM PROMPT:\n";
    txtContent += "-".repeat(80) + "\n";
    txtContent += request.systemPrompt + "\n\n";

    txtContent += "USER PROMPT:\n";
    txtContent += "-".repeat(80) + "\n";
    txtContent += request.userPrompt + "\n\n";

    if (request.imagesBase64 && request.imagesBase64.length > 0) {
      txtContent += "IMAGES:\n";
      txtContent += "-".repeat(80) + "\n";
      request.imagesBase64.forEach((img, idx) => {
        const sizeKB = Math.round((img.length * 3) / 4 / 1024);
        const mimeType = img.match(/^data:(.+);base64,/)?.[1] || "unknown";
        txtContent += `Image ${idx + 1}: ${mimeType}, ~${sizeKB}KB\n`;
        txtContent += `  Saved as: ${inputImagePaths[idx]}\n`;
      });
      txtContent += "\n";
    }

    txtContent += "API RESPONSE:\n";
    txtContent += "-".repeat(80) + "\n";
    if (response.error) {
      txtContent += `ERROR: ${response.error}\n\n`;
    } else {
      txtContent += response.content + "\n\n";
    }

    txtContent += "METADATA:\n";
    txtContent += "-".repeat(80) + "\n";
    txtContent += `Tokens Used: ${response.tokensUsed}\n`;
    txtContent += `Latency: ${response.latencyMs}ms\n`;
    txtContent += `Log Directory: ${callFolderName}\n`;
    txtContent += "=".repeat(80) + "\n";

    fs.writeFileSync(path.join(callDir, "request.txt"), txtContent);
  }

  async analyze(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    try {
      const { content, tokensUsed } = await this.callAPI(
        systemPrompt,
        userPrompt,
        imagesBase64,
      );

      const parsed = this.parseResponseContent(content) as Record<
        string,
        unknown
      >;
      const result = analysisResultSchema.parse({
        ...parsed,
        provider: this.name,
      });

      const latencyMs = Date.now() - startTime;

      // Log successful API call
      this.logAPICall(
        "analyze",
        {
          systemPrompt,
          userPrompt,
          imagesBase64,
        },
        {
          content,
          tokensUsed,
          latencyMs,
        },
      );

      return {
        result,
        tokensUsed,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Log failed API call
      this.logAPICall(
        "analyze",
        {
          systemPrompt,
          userPrompt,
          imagesBase64,
        },
        {
          content: "",
          tokensUsed: 0,
          latencyMs,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw error;
    }
  }

  async rethink(
    systemPrompt: string,
    userPrompt: string,
    previousResult: AnalysisResult,
    otherResults: AnalysisResult[],
    imagesBase64?: string[],
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

    const { content, tokensUsed } = await this.callAPI(
      systemPrompt,
      enhancedPrompt,
      imagesBase64,
    );

    const parsed = this.parseResponseContent(content) as Record<
      string,
      unknown
    >;
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
    systemPrompt: string,
    userPrompt: string,
    allResults: AnalysisResult[],
    imagesBase64?: string[],
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

    const { content, tokensUsed } = await this.callAPI(
      systemPrompt,
      synthesisPrompt,
      imagesBase64,
    );

    const parsed = this.parseResponseContent(content) as Record<
      string,
      unknown
    >;
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

  getName(): string {
    return this.name;
  }
}
