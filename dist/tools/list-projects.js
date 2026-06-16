export function listProjects(config) {
    const lines = [
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
        if (project.repos.length > 0) {
            lines.push(`- **Repos:**`);
            for (const r of project.repos) {
                lines.push(`  - \`${r.owner}/${r.name}\` (${r.branch}) — watch: ${r.watchPaths.join(", ") || "all"} | last synced: ${r.lastSyncedCommit || "never"}`);
            }
        }
        lines.push("");
    }
    return lines.join("\n");
}
//# sourceMappingURL=list-projects.js.map