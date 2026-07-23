import type { Config } from "../config/schema.js";

export function generateInstructions(_config: Config): string {
  return `## context-router

You have access to context-router MCP tools for loading and saving project context.

### Loading context

**\`/route [project]\`** — Call \`read_project\` immediately with the relevant terms as keywords. Do not ask for clarification first.

**\`/route\` (no argument)** — Call \`list_projects\`, then ask which one to load.

### Saving context

**\`/save\`** — Call \`write_project\` after showing the user a summary of what will change. Never write back without explicit confirmation.

### Managing projects

**\`/project-new\`** — Collect key, keywords, file, and optional workingDirs from the user, confirm all fields, then call \`create_project\`.

**\`/project-end\`** — Confirm the project key with the user, then call \`delete_project\`. The .md file in the claude-data repo is not deleted.

These instructions never need updating — project names and keywords live in the MCP server, not here.`;
}
