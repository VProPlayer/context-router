#!/usr/bin/env node
/**
 * SessionStart hook — runs at the start of every Claude Code session.
 *
 * Keeps the local claude-data clone current via git pull.
 * Context loading is on-demand via /load — not injected here.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

function expandHome(p) {
  return p.startsWith("~/") ? resolve(homedir(), p.slice(2)) : p;
}

function loadConfig() {
  const configPath =
    process.env.CONTEXT_ROUTER_CONFIG ??
    resolve(homedir(), ".config", "context-router", "config.json");
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

async function main() {
  const config = loadConfig();
  if (!config?.claudeDataLocal) process.exit(0);

  const localDir = expandHome(config.claudeDataLocal);
  if (existsSync(resolve(localDir, ".git"))) {
    try {
      execSync(`git -C "${localDir}" pull --ff-only --quiet`, {
        stdio: "pipe",
        timeout: 10_000,
      });
    } catch {
      // non-fatal
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
