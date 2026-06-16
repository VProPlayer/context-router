import { getGitHubClient, decodeGitHubContent } from "../github/client.js";
import type { Config } from "../config/schema.js";

export async function readRepoFile(config: Config, projectKey: string, path: string): Promise<string> {
  const project = config.projects[projectKey];
  if (!project) throw new Error(`Unknown project: "${projectKey}"`);
  if (project.repos.length === 0) throw new Error(`No repos configured for project: ${projectKey}`);

  // Use the first repo by default; caller can specify owner/name in path if needed
  const gh = getGitHubClient();
  const { owner, name, branch } = project.repos[0];
  const { data } = await gh.repos.getContent({ owner, repo: name, path, ref: branch });

  if (Array.isArray(data)) throw new Error(`Path "${path}" is a directory. Specify a file path.`);
  if (!("content" in data)) throw new Error(`No content at path: ${path}`);

  return decodeGitHubContent(data.content);
}
