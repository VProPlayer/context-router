import { Octokit } from "@octokit/rest";
import type { Config } from "../config/schema.js";

let _client: Octokit | null = null;

export function getGitHubClient(): Octokit {
  if (_client) return _client;
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required. " +
      "Set it in your shell profile or pass it via CLAUDE_MCP_ENV."
    );
  }
  _client = new Octokit({ auth: token });
  return _client;
}

export function decodeGitHubContent(content: unknown): string {
  if (typeof content !== "string") throw new Error("Unexpected non-string content from GitHub API");
  return Buffer.from(content, "base64").toString("utf-8");
}

export async function getClaudeDataFile(config: Config, filePath: string): Promise<string> {
  const gh = getGitHubClient();
  const { claudeDataRepo: repo } = config;
  const { data } = await gh.repos.getContent({
    owner: repo.owner,
    repo: repo.name,
    path: filePath,
    ref: repo.branch,
  });
  if (Array.isArray(data) || !("content" in data)) {
    throw new Error(`Unexpected response fetching ${filePath} from ${repo.owner}/${repo.name}`);
  }
  return decodeGitHubContent(data.content);
}

export async function getClaudeDataFileSha(config: Config, filePath: string): Promise<string | undefined> {
  try {
    const gh = getGitHubClient();
    const { claudeDataRepo: repo } = config;
    const { data } = await gh.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
      path: filePath,
      ref: repo.branch,
    });
    if (!Array.isArray(data) && "sha" in data) return data.sha as string;
  } catch {
    // file doesn't exist yet
  }
  return undefined;
}
