import type { Config } from "../config/schema.js";

export function generateInstructions(_config: Config): string {
  return `## context-router

You have access to context-router MCP tools for loading and saving project context.

**\`/context [project]\`** — When the user types \`/context\` followed by any text, call \`read_project\` immediately with those terms as keywords. Do not ask for clarification first.

**\`/context\` (no argument)** — Call \`list_projects\` to show available projects, then ask which one to load.

**\`/save\` or "update the context file"** — Call \`write_project\` after showing the user a summary of what will change and receiving explicit confirmation. Never write back without confirmation.

These instructions never need updating — project names and keywords live in the MCP server, not here.`;
}
