import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { ConfigSchema } from "../config/schema.js";

const DEFAULT_CONFIG_PATH = resolve(homedir(), ".config", "context-router", "config.json");

function getConfigPath(): string {
  return process.env.CONTEXT_ROUTER_CONFIG ?? DEFAULT_CONFIG_PATH;
}

export function deleteProject(key: string): string {
  const configPath = getConfigPath();
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    throw new Error(`Config not found at ${configPath}.`);
  }

  const config = ConfigSchema.parse(raw);

  if (!config.projects[key]) {
    const available = Object.keys(config.projects).join(", ");
    throw new Error(`Project "${key}" not found. Available: ${available}`);
  }

  const removed = config.projects[key];
  delete config.projects[key];

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

  return (
    `Project "${key}" removed from config.\n\n` +
    `- **Context file \`${removed.file}\` was NOT deleted** — it remains in your claude-data store.\n` +
    `- Keywords \`${removed.keywords.join(", ")}\` will no longer trigger context loading.\n` +
    (removed.workingDirs.length > 0
      ? `- Working dir auto-load disabled for: ${removed.workingDirs.join(", ")}\n`
      : "") +
    `\nTo permanently remove the context file, delete \`${removed.file}\` from your claude-data repo manually.`
  );
}
