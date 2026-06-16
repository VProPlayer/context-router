import { writeFileSync } from "node:fs";
export function deleteProject(key, config, configPath) {
    const project = config.projects[key];
    if (!project) {
        throw new Error(`Project "${key}" not found. Available: ${Object.keys(config.projects).join(", ")}`);
    }
    const { [key]: removed, ...rest } = config.projects;
    const updated = { ...config, projects: rest };
    writeFileSync(configPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
    return (`Project "${key}" removed from config.\n\n` +
        `- **Context file \`${removed.file}\` was NOT deleted** — it remains in your claude-data store.\n` +
        `- Keywords \`${removed.keywords.join(", ")}\` will no longer trigger context loading.\n` +
        (removed.workingDirs.length > 0 ? `- Working dir auto-load disabled for: ${removed.workingDirs.join(", ")}\n` : "") +
        `\nTo permanently remove the context file, delete \`${removed.file}\` from your claude-data repo manually.`);
}
//# sourceMappingURL=delete-project.js.map