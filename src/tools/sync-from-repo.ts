import { getGitHubClient } from "../github/client.js";
import type { Config } from "../config/schema.js";

export async function syncFromRepo(config: Config, projectKey: string): Promise<string> {
  const project = config.projects[projectKey];
  if (!project) throw new Error(`Unknown project: "${projectKey}"`);
  if (!project.repo) throw new Error(`No repo configured for project: ${projectKey}`);

  const gh = getGitHubClient();
  const { owner, name, branch, watchPaths, lastSyncedCommit, maxCommits } = project.repo;

  const { data: commits } = await gh.repos.listCommits({
    owner,
    repo: name,
    sha: branch,
    per_page: maxCommits,
  });

  if (commits.length === 0) return `No commits found in ${owner}/${name}@${branch}`;

  const sinceIndex = lastSyncedCommit ? commits.findIndex((c) => c.sha === lastSyncedCommit) : -1;
  const newCommits = sinceIndex > 0 ? commits.slice(0, sinceIndex) : commits;

  if (newCommits.length === 0) {
    return `Already up to date (last synced: ${lastSyncedCommit})`;
  }

  const latestSha = newCommits[0].sha;
  const lines: string[] = [
    `# Repo Sync: ${owner}/${name}\n`,
    `**Branch:** ${branch}`,
    `**New commits:** ${newCommits.length} (capped at ${maxCommits})`,
    `**Latest SHA:** \`${latestSha}\`\n`,
    "## Commits\n",
  ];

  for (const commit of newCommits) {
    const short = commit.sha.slice(0, 7);
    const msg = commit.commit.message.split("\n")[0];
    const author = commit.commit.author?.name ?? "unknown";
    lines.push(`- \`${short}\` ${msg} _(${author})_`);
  }

  if (watchPaths.length > 0) {
    lines.push("\n## Changed Files (watched paths)\n");
    try {
      const base = lastSyncedCommit || `${latestSha}^`;
      const { data: compare } = await gh.repos.compareCommitsWithBasehead({
        owner,
        repo: name,
        basehead: `${base}...${latestSha}`,
      });

      const watched = (compare.files ?? []).filter((f) =>
        watchPaths.some((p) => f.filename.startsWith(p))
      );

      if (watched.length === 0) {
        lines.push("_No changes in watched paths._");
      } else {
        for (const file of watched) {
          lines.push(`### \`${file.filename}\` (+${file.additions} / -${file.deletions})`);
          if (file.patch) {
            const patch = file.patch.length > 2000 ? file.patch.slice(0, 2000) + "\n... (truncated)" : file.patch;
            lines.push("```diff");
            lines.push(patch);
            lines.push("```\n");
          }
        }
      }
    } catch {
      lines.push("_Diff unavailable (base commit may have been GC'd)._");
    }
  }

  lines.push(`\n---`);
  lines.push(`**Action required:** After merging this into the project .md, update \`lastSyncedCommit\` in config.json to \`${latestSha}\`.`);

  return lines.join("\n");
}
