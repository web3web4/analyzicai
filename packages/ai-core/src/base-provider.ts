import { z } from "zod";
import { BaseAnalysisResult } from "./types";
import { ModelTier } from "./domains/ux-analysis/types"; // Keep ModelTier for now, or move it to generic types

// Conditionally import Node.js modules only in server environments to prevent client-side bundling issues
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;

// Import fs/path dynamically in Node.js environments only
if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  try {
    fs = require("fs");
    path = require("path");
  } catch (e) {
    // Ignore errors in non-Node environments
  }
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  modelTier?: ModelTier; // Optional tier selection
}

export abstract class BaseAIProvider<TResult extends BaseAnalysisResult> {
  protected name: string;
  protected config: AIProviderConfig;
  protected schema: z.ZodSchema<TResult>;
  private logDir?: string;

  constructor(
    name: string,
    config: AIProviderConfig,
    schema: z.ZodSchema<TResult>,
  ) {
    this.name = name;
    this.config = config;
    this.schema = schema;

    // Set up logging directory if enabled (ENABLE_API_LOGGING=true)
    if (process.env.ENABLE_API_LOGGING === "true" && fs && path) {
      this.logDir = path.join(process.cwd(), "test-logs", name);
      // Synchronous setup acceptable during initialization; async operations used during runtime
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
   * Attempt to repair truncated JSON by closing open brackets/braces
   */
  private repairTruncatedJSON(json: string): string {
    // Count open brackets and braces
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;

    for (const char of json) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\" && inString) {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === "{") openBraces++;
      if (char === "}") openBraces--;
      if (char === "[") openBrackets++;
      if (char === "]") openBrackets--;
    }

    // If we're in a string, close it
    let repaired = json;
    if (inString) {
      repaired += '"';
    }

    // Close any open brackets/braces
    while (openBrackets > 0) {
      repaired += "]";
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += "}";
      openBraces--;
    }

    return repaired;
  }

  /**
   * Hook for parsing response content.
   * Override this if provider needs special handling beyond the default strategies.
   * Default implementation tries multiple strategies to extract JSON from various formats.
   */
  protected parseResponseContent(content: string): unknown {
    // Try to extract JSON using multiple strategies
    let jsonContent: string | undefined;

    // Strategy 1: Look for markdown-wrapped JSON
    const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch?.[1]) {
      jsonContent = markdownMatch[1].trim();
    }

    // Strategy 2: Extract raw JSON object from prose (look for {...})
    if (!jsonContent) {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch?.[0]) {
        jsonContent = objectMatch[0];
      }
    }

    // Strategy 3: Assume entire content is JSON
    if (!jsonContent) {
      jsonContent = content.trim();
    }

    // Attempt to parse with helpful error messages
    try {
      return JSON.parse(jsonContent);
    } catch (firstError) {
      // Strategy 4: Try to repair truncated JSON
      try {
        const repaired = this.repairTruncatedJSON(jsonContent);
        console.warn(this.name, "Attempting to repair truncated JSON response");
        return JSON.parse(repaired);
      } catch (repairError) {
        // Repair failed, throw original error with details
        console.error(this.name, "Content length:", content.length);
        console.error(
          this.name,
          "JSON content (last 500 chars):",
          jsonContent.slice(-500),
        );
        const preview = content.substring(0, 200).replace(/\n/g, " ");
        throw new Error(
          `Failed to parse ${this.name} response as JSON. ` +
            `Response preview: "${preview}${
              content.length > 200 ? "..." : ""
            }" ` +
            `Parse error: ${
              firstError instanceof Error
                ? firstError.message
                : String(firstError)
            }. ` +
            `Tip: Ensure the system prompt explicitly requires JSON-only output.`,
        );
      }
    }
  }

  /**
   * Log API request and response to a dedicated folder with JSON, TXT, and image files.
   */
  private async logAPICall(
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
  ): Promise<void> {
    if (!this.logDir || !fs || !path) return;

    try {
      const now = new Date();
      // Use local time for folder names (easier to correlate with test runs)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ms = String(now.getMilliseconds()).padStart(3, "0");
      const localTimestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}-${ms}Z`;

      // Use UTC for JSON log metadata (standard format)
      const isoTimestamp = now.toISOString();
      const callFolderName = `${methodName}_${localTimestamp}`;
      const callDir = path.join(this.logDir, callFolderName);

      await fs.promises.mkdir(callDir, { recursive: true });

      // Process images in parallel, keeping full results array (including nulls) for index alignment
      const imageResults: (string | null)[] = request.imagesBase64?.length
        ? await Promise.all(
            request.imagesBase64.map(async (imageBase64, idx) => {
              try {
                // Optimization: Parse only the header, not the entire (potentially huge) base64 string
                const commaIndex = imageBase64.indexOf(",");
                if (commaIndex === -1) return null;

                const header = imageBase64.substring(0, commaIndex);
                const matches = header.match(/^data:(.+);base64$/);
                if (!matches) return null;

                const mimeType = matches[1];
                const extension = mimeType.split("/")[1] || "png";
                const filename = `input_image_${idx + 1}.${extension}`;
                const imagePath = path.join(callDir, filename);

                // Optimization: Write directly with base64 encoding to avoid Buffer allocation
                await fs.promises.writeFile(
                  imagePath,
                  imageBase64.substring(commaIndex + 1),
                  "base64",
                );
                return filename;
              } catch (imgError) {
                console.warn(
                  `[${this.name}] Failed to save image ${idx + 1}:`,
                  imgError,
                );
                return null;
              }
            }),
          )
        : [];

      // Extract successful saves for JSON log
      const inputImagePaths = imageResults.filter(
        (f): f is string => f !== null,
      );

      // Write JSON log with full request/response data
      const logData = {
        provider: this.name,
        method: methodName,
        timestamp: isoTimestamp,
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

      await fs.promises.writeFile(
        path.join(callDir, "request.json"),
        JSON.stringify(logData, null, 2),
      );

      // Build human-readable text log
      let txtContent = "";
      txtContent += "=".repeat(80) + "\n";
      txtContent += `PROVIDER: ${this.name}\n`;
      txtContent += `METHOD: ${methodName}\n`;
      txtContent += `TIMESTAMP: ${isoTimestamp}\n`;
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
          // Use imageResults to maintain index alignment
          txtContent += `  Saved as: ${
            imageResults[idx] || "[failed to save]"
          }\n`;
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

      await fs.promises.writeFile(
        path.join(callDir, "request.txt"),
        txtContent,
      );
    } catch (error) {
      console.error(
        `[${this.name}] Failed to log API call for ${methodName}:`,
        error,
      );
    }
  }

  /**
   * Common wrapper for API calls with error handling and logging.
   * All public methods (analyze, rethink, synthesize) use this to ensure consistent behavior.
   */
  private async executeWithLogging(
    methodName: string,
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    let content = "";
    let tokensUsed = 0;

    try {
      const apiResponse = await this.callAPI(
        systemPrompt,
        userPrompt,
        imagesBase64,
      );
      content = apiResponse.content;
      tokensUsed = apiResponse.tokensUsed;

      const latencyMs = Date.now() - startTime;

      // Log BEFORE parsing - this ensures we capture the raw response even if parsing fails
      try {
        await this.logAPICall(
          methodName,
          { systemPrompt, userPrompt, imagesBase64 },
          { content, tokensUsed, latencyMs },
        );
      } catch (logError) {
        console.error(
          `[${this.name}] Logging error in ${methodName}:`,
          logError,
        );
      }

      // Now parse and validate
      const parsed = this.parseResponseContent(content) as Record<
        string,
        unknown
      >;

      // Debug logging for synthesis issues
      if (methodName === "synthesize") {
        console.log(`[${this.name}] Synthesis parsed response:`, {
          hasContent: !!content,
          contentLength: content?.length,
          parsedKeys: Object.keys(parsed),
          parsedSample: JSON.stringify(parsed).substring(0, 500),
        });
      }

      const result = this.schema.parse({
        ...parsed,
        provider: this.name,
      });

      return { result, tokensUsed, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Log the error (this will update the existing log or create a new one if logging failed earlier)
      try {
        await this.logAPICall(
          methodName,
          { systemPrompt, userPrompt, imagesBase64 },
          {
            content: content || "",
            tokensUsed,
            latencyMs,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      } catch (logError) {
        console.error(
          `[${this.name}] Logging error in ${methodName}:`,
          logError,
        );
      }

      throw error;
    }
  }

  async analyze(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    return this.executeWithLogging(
      "analyze",
      systemPrompt,
      userPrompt,
      imagesBase64,
    );
  }

  async rethink(
    systemPrompt: string,
    userPrompt: string,
    previousResult: TResult,
    otherResults: TResult[],
    imagesBase64?: string[],
  ): Promise<{
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const enhancedPrompt = `${userPrompt}

## Your Previous Analysis
${JSON.stringify(previousResult, null, 2)}

## Other AI Perspectives
${otherResults
  .map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`)
  .join("\n\n")}

Based on these other perspectives, reconsider your analysis. Where do you agree or disagree? Provide your revised assessment.`;

    return this.executeWithLogging(
      "rethink",
      systemPrompt,
      enhancedPrompt,
      imagesBase64,
    );
  }

  async synthesize(
    systemPrompt: string,
    userPrompt: string,
    allResults: TResult[],
    imagesBase64?: string[],
  ): Promise<{
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const synthesisPrompt = `${userPrompt}

## All Provider Analyses
${allResults
  .map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`)
  .join("\n\n")}

Synthesize these analyses into a final, comprehensive result. Resolve any disagreements between providers, and provide weighted scores based on the consensus. Highlight areas of high agreement and areas where providers significantly disagreed. Provide only the JSON object.`;

    return this.executeWithLogging(
      "synthesize",
      systemPrompt,
      synthesisPrompt,
      imagesBase64,
    );
  }

  getName(): string {
    return this.name;
  }
}
