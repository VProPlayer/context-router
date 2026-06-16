import { getGitHubClient } from "../github/client.js";
import type { Config, RepoConfig } from "../config/schema.js";

type GitHubFile = { filename: string; additions: number; deletions: number; patch?: string };

async function fetchWatchedDiff(
  owner: string,
  name: string,
  base: string,
  head: string,
  watchPaths: string[]
): Promise<GitHubFile[]> {
  const gh = getGitHubClient();
  const { data } = await gh.repos.compareCommitsWithBasehead({
    owner,
    repo: name,
    basehead: `${base}...${head}`,
  });
  const files = data.files ?? [];
  return watchPaths.length === 0 ? files : files.filter((f) => watchPaths.some((p) => f.filename.startsWith(p)));
}

function formatDiff(files: GitHubFile[]): string {
  if (files.length === 0) return "_No changes in watched paths._";
  return files
    .map((f) => {
      const header = `#### \`${f.filename}\` (+${f.additions} / -${f.deletions})`;
      if (!f.patch) return header;
      const patch = f.patch.length > 2000 ? f.patch.slice(0, 2000) + "\n... (truncated)" : f.patch;
      return `${header}\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");
}

async function syncRepo(repo: RepoConfig): Promise<string> {
  const gh = getGitHubClient();
  const { owner, name, branch, watchPaths, lastSyncedCommit, maxCommits } = repo;

  const { data: commits } = await gh.repos.listCommits({ owner, repo: name, sha: branch, per_page: maxCommits });
  if (commits.length === 0) return `_No commits found in ${owner}/${name}@${branch}_`;

  const sinceIndex = lastSyncedCommit ? commits.findIndex((c) => c.sha === lastSyncedCommit) : -1;
  const newCommits = sinceIndex > 0 ? commits.slice(0, sinceIndex) : commits;

  if (newCommits.length === 0) return `_Already up to date (last synced: ${lastSyncedCommit})_`;

  const latestSha = newCommits[0].sha;
  const lines: string[] = [
    `**Branch:** ${branch} | **New commits:** ${newCommits.length} | **Latest:** \`${latestSha.slice(0, 7)}\`\n`,
    ...newCommits.map((c) => {
      const short = c.sha.slice(0, 7);
      const msg = c.commit.message.split("\n")[0];
      const author = c.commit.author?.name ?? "unknown";
      return `- \`${short}\` ${msg} _(${author})_`;
    }),
  ];

  try {
    const base = lastSyncedCommit || `${latestSha}^`;
    const watched = await fetchWatchedDiff(owner, name, base, latestSha, watchPaths);
    if (watched.length > 0) {
      lines.push("\n**Changed files:**\n");
      lines.push(formatDiff(watched));
    }
  } catch {
    lines.push("\n_Diff unavailable (base commit may have been GC'd)._");
  }

  lines.push(`\n_Update \`lastSyncedCommit\` to \`${latestSha}\` after merging._`);
  return lines.join("\n");
}

export async function syncFromRepo(config: Config, projectKey: string): Promise<string> {
  const project = config.projects[projectKey];
  if (!project) throw new Error(`Unknown project: "${projectKey}"`);
  if (project.repos.length === 0) throw new Error(`No repos configured for project: ${projectKey}`);

  const results = await Promise.all(
    project.repos.map(async (repo) => {
      const header = `## ${repo.owner}/${repo.name}\n`;
      try {
        return header + (await syncRepo(repo));
      } catch (err) {
        return header + `_Error: ${err instanceof Error ? err.message : String(err)}_`;
      }
    })
  );

  return [`# Repo Sync: ${projectKey}\n`, ...results].join("\n---\n");
}
