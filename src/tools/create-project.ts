import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { ConfigSchema, ProjectSchema, type Project } from "../config/schema.js";
import { expandHome } from "../config/loader.js";

const DEFAULT_CONFIG_PATH = resolve(homedir(), ".config", "context-router", "config.json");

function getConfigPath(): string {
  return process.env.CONTEXT_ROUTER_CONFIG ?? DEFAULT_CONFIG_PATH;
}

export function createProject(key: string, project: Project): string {
  if (!/^[a-z0-9-]+$/.test(key)) {
    throw new Error(`Project key must be lowercase alphanumeric with hyphens only. Got: "${key}"`);
  }

  // Validate project shape before touching disk
  ProjectSchema.parse(project);

  const configPath = getConfigPath();
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    throw new Error(
      `Config not found at ${configPath}. ` +
      `Create it first from config.example.json.`
    );
  }

  const config = ConfigSchema.parse(raw);

  if (config.projects[key]) {
    throw new Error(
      `Project "${key}" already exists. ` +
      `Use write_project to update its context file, or edit config.json directly to change its metadata.`
    );
  }

  config.projects[key] = project;

  // Ensure directory exists (idempotent)
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

  return (
    `Project "${key}" added to config.\n\n` +
    `- **File:** ${project.file} (create this in your claude-data repo/local clone)\n` +
    `- **Keywords:** ${project.keywords.join(", ")}\n` +
    `- **Working dirs:** ${project.workingDirs.join(", ") || "none"}\n` +
    (project.repo ? `- **Repo:** ${project.repo.owner}/${project.repo.name}\n` : "") +
    `\nNext: create \`${project.file}\` in your claude-data store with initial project context.`
  );
}
