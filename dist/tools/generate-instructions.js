export function generateInstructions(_config) {
    return `## context-router

You have access to context-router MCP tools for loading and saving project context.

**\`/load [project]\`** — When the user types \`/load\` followed by any text, call \`read_project\` immediately with those terms as keywords. Do not ask for clarification first.

**\`/load\` (no argument)** — Call \`list_projects\` to show available projects, then ask which one to load.

**Topic signals** — If the user seems to be referencing a specific project by name or domain term and no project context is loaded yet, call \`read_project\` with the relevant terms. The tool returns a "no match" message if nothing fits — false positives are harmless.

**\`/save\` or "update the context file"** — Call \`write_project\` after showing the user a summary of what will change and receiving explicit confirmation. Never write back without confirmation.

These instructions never need updating — project names and keywords live in the MCP server, not here.`;
}
//# sourceMappingURL=generate-instructions.js.map