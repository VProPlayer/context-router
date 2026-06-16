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
  return (data.files ?? []).filter((f) => watchPaths.some((p) => f.filename.startsWith(p)));
}

function formatDiff(files: GitHubFile[]): string {
  if (files.length === 0) return "_No changes in watched paths._";
  return files
    .map((f) => {
      const header = `### \`${f.filename}\` (+${f.additions} / -${f.deletions})`;
      if (!f.patch) return header;
      const patch = f.patch.length > 2000 ? f.patch.slice(0, 2000) + "\n... (truncated)" : f.patch;
      return `${header}\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");
}

export async function syncFromRepo(config: Config, projectKey: string): Promise<string> {
  const project = config.projects[projectKey];
  if (!project) throw new Error(`Unknown project: "${projectKey}"`);
  if (!project.repo) throw new Error(`No repo configured for project: ${projectKey}`);

  const gh = getGitHubClient();
  const { owner, name, branch, watchPaths, lastSyncedCommit, maxCommits }: RepoConfig = project.repo;

  const { data: commits } = await gh.repos.listCommits({ owner, repo: name, sha: branch, per_page: maxCommits });
  if (commits.length === 0) return `No commits found in ${owner}/${name}@${branch}`;

  const sinceIndex = lastSyncedCommit ? commits.findIndex((c) => c.sha === lastSyncedCommit) : -1;
  const newCommits = sinceIndex > 0 ? commits.slice(0, sinceIndex) : commits;

  if (newCommits.length === 0) return `Already up to date (last synced: ${lastSyncedCommit})`;

  const latestSha = newCommits[0].sha;
  const lines: string[] = [
    `# Repo Sync: ${owner}/${name}\n`,
    `**Branch:** ${branch}`,
    `**New commits:** ${newCommits.length} (capped at ${maxCommits})`,
    `**Latest SHA:** \`${latestSha}\`\n`,
    "## Commits\n",
    ...newCommits.map((c) => {
      const short = c.sha.slice(0, 7);
      const msg = c.commit.message.split("\n")[0];
      const author = c.commit.author?.name ?? "unknown";
      return `- \`${short}\` ${msg} _(${author})_`;
    }),
  ];

  if (watchPaths.length > 0) {
    lines.push("\n## Changed Files (watched paths)\n");
    try {
      const base = lastSyncedCommit || `${latestSha}^`;
      const watched = await fetchWatchedDiff(owner, name, base, latestSha, watchPaths);
      lines.push(formatDiff(watched));
    } catch {
      lines.push("_Diff unavailable (base commit may have been GC'd)._");
    }
  }

  lines.push(
    `\n---`,
    `**Action required:** After merging into the project .md, update \`lastSyncedCommit\` in config.json to \`${latestSha}\`.`
  );

  return lines.join("\n");
}
