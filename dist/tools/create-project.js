import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ProjectSchema } from "../config/schema.js";
export function createProject(key, project, config, configPath) {
    if (!/^[a-z0-9-]+$/.test(key)) {
        throw new Error(`Project key must be lowercase alphanumeric with hyphens only. Got: "${key}"`);
    }
    ProjectSchema.parse(project);
    if (config.projects[key]) {
        throw new Error(`Project "${key}" already exists. ` +
            `Use write_project to update its context file, or edit config.json directly to change its metadata.`);
    }
    const updated = { ...config, projects: { ...config.projects, [key]: project } };
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
    return (`Project "${key}" added to config.\n\n` +
        `- **File:** ${project.file} (create this in your claude-data repo/local clone)\n` +
        `- **Keywords:** ${project.keywords.join(", ")}\n` +
        `- **Working dirs:** ${project.workingDirs.join(", ") || "none"}\n` +
        (project.repos.length > 0 ? `- **Repos:** ${project.repos.map((r) => `${r.owner}/${r.name}`).join(", ")}\n` : "") +
        `\nNext: create \`${project.file}\` in your claude-data store with initial project context.`);
}
//# sourceMappingURL=create-project.js.map