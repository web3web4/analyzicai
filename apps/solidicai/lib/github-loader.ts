import { ContractContext } from "@web3web4/ai-core";

interface GitHubParsedUrl {
  owner: string;
  repo: string;
  path?: string;
  branch?: string;
  isFolder?: boolean;
}

export function parseGitHubUrl(url: string): GitHubParsedUrl | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== "github.com") return null;

    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    // Handle specific file/blob paths
    // Format: /owner/repo/blob/branch/path/to/file.sol
    if (parts[2] === "blob" && parts.length >= 4) {
      const branch = parts[3];
      const path = parts.slice(4).join("/");
      return { owner, repo, branch, path, isFolder: false };
    }

    // Handle folder/tree paths
    // Format: /owner/repo/tree/branch/path/to/folder
    if (parts[2] === "tree" && parts.length >= 4) {
      const branch = parts[3];
      const path = parts.length > 4 ? parts.slice(4).join("/") : "";
      return { owner, repo, branch, path, isFolder: true };
    }

    // Repo root - fetch from default branch
    return { owner, repo, isFolder: true };
  } catch {
    return null;
  }
}

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
  url?: string;
}

async function fetchDirectoryContents(
  owner: string,
  repo: string,
  path: string = "",
  branch: string = "main",
): Promise<GitHubFile[]> {
  // Use GitHub API to list directory contents
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  // Add GitHub token if available (for higher rate limits)
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    // Try with 'master' branch if 'main' fails
    if (branch === "main" && response.status === 404) {
      return fetchDirectoryContents(owner, repo, path, "master");
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}

async function fetchAllSolidityFiles(
  owner: string,
  repo: string,
  path: string = "",
  branch: string = "main",
): Promise<{ path: string; content: string }[]> {
  const contents = await fetchDirectoryContents(owner, repo, path, branch);
  const files: { path: string; content: string }[] = [];

  for (const item of contents) {
    if (item.type === "file" && item.name.endsWith(".sol")) {
      // Fetch the file content
      if (item.download_url) {
        const response = await fetch(item.download_url);
        if (response.ok) {
          const content = await response.text();
          files.push({ path: item.path, content });
        }
      }
    } else if (item.type === "dir") {
      // Recursively fetch from subdirectories
      const subFiles = await fetchAllSolidityFiles(
        owner,
        repo,
        item.path,
        branch,
      );
      files.push(...subFiles);
    }
  }

  return files;
}

export async function fetchGitHubCode(url: string): Promise<string> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub URL");
  }

  // If it's a specific file
  if (parsed.path && !parsed.isFolder) {
    const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${
      parsed.repo
    }/${parsed.branch || "main"}/${parsed.path}`;
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  }

  // If it's a raw URL
  if (url.includes("raw.githubusercontent.com")) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return await response.text();
  }

  // If it's a folder or repo root, fetch all .sol files
  if (parsed.isFolder) {
    const branch = parsed.branch || "main";
    const files = await fetchAllSolidityFiles(
      parsed.owner,
      parsed.repo,
      parsed.path || "",
      branch,
    );

    if (files.length === 0) {
      throw new Error(
        "No Solidity files found in the specified repository/folder",
      );
    }

    // Combine all files with clear separators
    const combined = files
      .map(
        (file) =>
          `// ============================================================
// FILE: ${file.path}
// ============================================================\n\n${file.content}`,
      )
      .join("\n\n");

    return combined;
  }

  throw new Error(
    "Please provide a valid GitHub URL (file, folder, or repository root)",
  );
}
