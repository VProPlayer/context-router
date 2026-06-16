import { getGitHubClient } from "../github/client.js";
import type { Config } from "../config/schema.js";

export async function readRepoFile(config: Config, projectKey: string, path: string): Promise<string> {
  const project = config.projects[projectKey];
  if (!project) throw new Error(`Unknown project: "${projectKey}"`);
  if (!project.repo) throw new Error(`No repo configured for project: ${projectKey}`);

  const gh = getGitHubClient();
  const { owner, name, branch } = project.repo;

  const { data } = await gh.repos.getContent({ owner, repo: name, path, ref: branch });

  if (Array.isArray(data)) throw new Error(`Path "${path}" is a directory. Specify a file path.`);
  if (!("content" in data)) throw new Error(`No content at path: ${path}`);

  return Buffer.from(data.content as string, "base64").toString("utf-8");
}
