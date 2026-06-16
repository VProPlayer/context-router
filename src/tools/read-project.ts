import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getGitHubClient } from "../github/client.js";
import { expandHome } from "../config/loader.js";
import type { Config } from "../config/schema.js";

function scoreProject(projectKeywords: string[], queryKeywords: string[]): number {
  let score = 0;
  const lower = queryKeywords.map((k) => k.toLowerCase());
  for (const kw of projectKeywords) {
    const lkw = kw.toLowerCase();
    for (const q of lower) {
      if (lkw === q) score += 2;
      else if (lkw.includes(q) || q.includes(lkw)) score += 1;
    }
  }
  return score;
}

export async function readProject(config: Config, keywords: string[]): Promise<string> {
  const scored = Object.entries(config.projects)
    .map(([key, project]) => ({ key, score: scoreProject(project.keywords, keywords) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) {
    const available = Object.keys(config.projects).join(", ");
    return `No project matched keywords: [${keywords.join(", ")}]. Available projects: ${available}`;
  }

  const project = config.projects[best.key];

  if (config.claudeDataLocal) {
    try {
      const path = resolve(expandHome(config.claudeDataLocal), project.file);
      return readFileSync(path, "utf-8");
    } catch {
      // fall through to GitHub API
    }
  }

  const gh = getGitHubClient();
  const { claudeDataRepo: repo } = config;
  const res = await gh.repos.getContent({ owner: repo.owner, repo: repo.name, path: project.file, ref: repo.branch });

  if (Array.isArray(res.data) || !("content" in res.data)) {
    throw new Error(`Unexpected response fetching ${project.file}`);
  }

  return Buffer.from(res.data.content as string, "base64").toString("utf-8");
}

export function matchProjectByDir(config: Config, cwd: string): { key: string; file: string } | null {
  const normalized = cwd.replace(/\/$/, "");
  for (const [key, project] of Object.entries(config.projects)) {
    for (const dir of project.workingDirs) {
      const expanded = expandHome(dir).replace(/\/$/, "");
      if (normalized === expanded || normalized.startsWith(expanded + "/")) {
        return { key, file: project.file };
      }
    }
  }
  return null;
}
