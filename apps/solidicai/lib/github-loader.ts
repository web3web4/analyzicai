import { ContractContext } from "@web3web4/ai-core";

export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string; path?: string; branch?: string } | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== "github.com") return null;

    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    // Handle specific file/blob paths
    // Format: /owner/repo/blob/branch/path/to/file
    if (parts[2] === "blob" && parts.length >= 4) {
      const branch = parts[3];
      const path = parts.slice(4).join("/");
      return { owner, repo, branch, path };
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

export async function fetchGitHubCode(url: string): Promise<string> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub URL");
  }

  // If it's a specific file
  if (parsed.path) {
    const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.branch || "main"}/${parsed.path}`;
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  }

  // If it's a repo root, we might need to use GitHub API to list files
  // For MVP, let's strictly support single file URLs or raw URLs
  // Or if it's a raw URL already
  if (url.includes("raw.githubusercontent.com")) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  }

  throw new Error(
    "Please provide a URL to a specific file (e.g., https://github.com/owner/repo/blob/main/contracts/Token.sol)",
  );
}
