import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { ConfigSchema, type Config } from "./schema.js";

const DEFAULT_CONFIG_PATH = resolve(homedir(), ".config", "context-router", "config.json");

export function loadConfig(configPath?: string): Config {
  const path = configPath ?? process.env.CONTEXT_ROUTER_CONFIG ?? DEFAULT_CONFIG_PATH;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    throw new Error(
      `Failed to read config at ${path}. ` +
      `Set CONTEXT_ROUTER_CONFIG or create ~/.config/context-router/config.json. ` +
      `See config.example.json for the schema. (${err instanceof Error ? err.message : err})`
    );
  }
  return ConfigSchema.parse(raw);
}

export function expandHome(p: string): string {
  return p.startsWith("~/") ? resolve(homedir(), p.slice(2)) : p;
}
