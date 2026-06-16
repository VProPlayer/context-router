export function generateInstructions(_config) {
    return `## context-router

You have access to context-router MCP tools for loading and saving project context.

### Loading context

**\`/route [project]\`** or natural language (e.g. "let's work on courtquest", "pull up my VV context") — Call \`read_project\` immediately with the relevant terms as keywords. Do not ask for clarification first.

**\`/route\` (no argument)** or "what projects do I have" — Call \`list_projects\`, then ask which one to load.

### Saving context

**\`/save\`, "update the context file", "save my context"** — Call \`write_project\` after showing the user a summary of what will change. Never write back without explicit confirmation.

### Managing projects

**\`/project-new\`** or "add a project", "create a new project", "track a new project" — Collect key, keywords, file, and optional workingDirs from the user, confirm all fields, then call \`create_project\`.

**\`/project-end\`** or "remove a project", "delete a project", "stop tracking X" — Confirm the project key with the user, then call \`delete_project\`. The .md file in the claude-data repo is not deleted.

**\`/project-sync\`** or "sync my repo", "pull in recent commits" — Call \`sync_from_repo\` for the relevant project, then merge the returned summary into the project context.

These instructions never need updating — project names and keywords live in the MCP server, not here.`;
}
//# sourceMappingURL=generate-instructions.js.map