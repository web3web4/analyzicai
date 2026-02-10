import { WebsiteContext } from "./types";

/**
 * Build a context-enhanced prompt section from website context data.
 * This enriches the AI system prompt with user-provided demographics and business information.
 */
export function buildContextPrompt(context?: WebsiteContext): string {
  if (!context) return "";

  const parts: string[] = [];

  if (context.targetAge.length > 0) {
    parts.push(`Target audience age groups: ${context.targetAge.join(", ")}`);
  }

  if (context.targetGender && context.targetGender !== "any") {
    parts.push(`Primary gender audience: ${context.targetGender}`);
  }

  if (context.educationLevel && context.educationLevel !== "any") {
    parts.push(`Target education level: ${context.educationLevel}`);
  }

  if (context.incomeLevel && context.incomeLevel !== "any") {
    parts.push(`Target income level: ${context.incomeLevel}`);
  }

  if (context.techFriendliness && context.techFriendliness !== "any") {
    parts.push(`User tech-friendliness: ${context.techFriendliness}`);
  }

  if (context.businessSector.length > 0) {
    parts.push(
      `Business sector/industry: ${context.businessSector.join(", ")}`,
    );
  }

  if (context.additionalContext) {
    parts.push(`Additional context: ${context.additionalContext}`);
  }

  if (parts.length === 0) return "";

  return `\n\n## Website Context\nThe website being analyzed has the following characteristics:\n${parts.map((p) => `- ${p}`).join("\n")}\n\nPlease tailor your analysis to be relevant for this specific audience and business context.`;
}
