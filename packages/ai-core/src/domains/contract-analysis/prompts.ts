import { ContractContext } from "./types";

export function buildContextPrompt(context?: ContractContext): string {
  if (!context) return "";

  let prompt = "\n\n## Additional Contract Context\n";

  if (context.contractName) {
    prompt += `Contract Name: ${context.contractName}\n`;
  }
  if (context.blockchain) {
    prompt += `Target Blockchain: ${context.blockchain}\n`;
  }
  if (context.solidityVersion) {
    prompt += `Solidity Version: ${context.solidityVersion}\n`;
  }
  if (context.purpose) {
    prompt += `Contract Purpose: ${context.purpose}\n`;
  }
  if (context.githubRepo) {
    prompt += `GitHub Repository: ${context.githubRepo}\n`;
  }

  return prompt;
}

export function buildPrompt(
  template: string,
  vars: Record<string, any>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key]?.toString() || match;
  });
}
