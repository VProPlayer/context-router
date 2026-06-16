import type { Config } from "../config/schema.js";

export function listProjects(config: Config): string {
  const lines: string[] = [
    `# Context Router — Projects\n`,
    `**Claude Data Repo:** ${config.claudeDataRepo.owner}/${config.claudeDataRepo.name} (${config.claudeDataRepo.branch})`,
    `**Local clone:** ${config.claudeDataLocal ?? "not configured (using GitHub API)"}\n`,
    "---\n",
  ];

  for (const [key, project] of Object.entries(config.projects)) {
    lines.push(`## ${key}`);
    lines.push(`- **File:** \`${project.file}\``);
    lines.push(`- **Keywords:** ${project.keywords.join(", ")}`);
    lines.push(`- **Working dirs:** ${project.workingDirs.length > 0 ? project.workingDirs.join(", ") : "none"}`);
    lines.push(`- **Write-back:** ${project.writeBack}`);
    if (project.repo) {
      const r = project.repo;
      lines.push(`- **Repo:** \`${r.owner}/${r.name}\` (${r.branch})`);
      lines.push(`  - Watch paths: ${r.watchPaths.join(", ") || "all"}`);
      lines.push(`  - Last synced: ${r.lastSyncedCommit || "never"}`);
      lines.push(`  - Max commits: ${r.maxCommits}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
