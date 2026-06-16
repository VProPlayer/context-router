import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadConfig } from "./config/loader.js";
import { getConfigPath } from "./utils/path.js";
import { readProject } from "./tools/read-project.js";
import { writeProject } from "./tools/write-project.js";
import { listProjects } from "./tools/list-projects.js";
import { syncFromRepo } from "./tools/sync-from-repo.js";
import { readRepoFile } from "./tools/read-repo-file.js";
import { createProject } from "./tools/create-project.js";
import { deleteProject } from "./tools/delete-project.js";
import { generateInstructions } from "./tools/generate-instructions.js";
const TOOLS = [
    {
        name: "read_project",
        description: "Load the most relevant project context file by scoring keyword matches. " +
            "Call proactively when the user mentions a project by name, acronym, or topic — even in natural language (e.g. 'let's work on courtquest', 'pull up my VV context'). " +
            "Also call when the user types /route followed by any keyword. " +
            "Returns the full .md content for the best-matching project.",
        inputSchema: {
            type: "object",
            properties: {
                keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Topic signals extracted from the conversation (project names, acronyms, domain terms)",
                },
            },
            required: ["keywords"],
        },
    },
    {
        name: "write_project",
        description: "Write updated project context back to the canonical store. " +
            "Commits via GitHub API, or via local git if claudeDataLocal is set. " +
            "Call when the user says /save, 'update the context file', 'save my context', 'write back', or similar. " +
            "Always show a summary of changes and get explicit confirmation before calling.",
        inputSchema: {
            type: "object",
            properties: {
                project: { type: "string", description: "Project key (e.g. 'courtquest'). Use list_projects to confirm." },
                content: { type: "string", description: "Full updated markdown content for the project file." },
            },
            required: ["project", "content"],
        },
    },
    {
        name: "list_projects",
        description: "List all configured projects — keys, keywords, files, working directories, and repo info. " +
            "Call when the user types /route with no argument, asks 'what projects do I have', 'show my projects', or similar.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "sync_from_repo",
        description: "Fetch commits and diffs from a project's GitHub repo since the last sync. " +
            "Returns a structured markdown summary for Claude to merge into the project .md. " +
            "Call when the user types /project-sync, 'sync my repo', 'pull in recent commits', or asks to update context with recent code changes. " +
            "Claude does the merge — this tool provides raw delta only.",
        inputSchema: {
            type: "object",
            properties: {
                project: { type: "string", description: "Project key to sync repo state for." },
            },
            required: ["project"],
        },
    },
    {
        name: "create_project",
        description: "Add a new project entry to config.json. " +
            "Validates the schema, checks for duplicate keys, and writes atomically. " +
            "Call when the user types /project-new or asks to 'add a project', 'create a new project', 'track a new project', or similar. " +
            "Collect key, keywords, file, and optional workingDirs/repos from the user before calling — confirm all fields first.",
        inputSchema: {
            type: "object",
            properties: {
                key: { type: "string", description: "Project identifier — lowercase alphanumeric with hyphens (e.g. 'my-project')" },
                keywords: { type: "array", items: { type: "string" }, description: "Topic signals that trigger this project's context" },
                file: { type: "string", description: "Filename in the claude-data store (e.g. 'my-project.md')" },
                workingDirs: { type: "array", items: { type: "string" }, description: "Local directories that trigger this project in /load" },
                writeBack: { type: "boolean", description: "Whether /project-sync can write back (default: true)" },
                repos: {
                    type: "array",
                    description: "GitHub repos to sync commits from (supports multiple per project)",
                    items: {
                        type: "object",
                        properties: {
                            owner: { type: "string" },
                            name: { type: "string" },
                            branch: { type: "string" },
                            watchPaths: { type: "array", items: { type: "string" } },
                            maxCommits: { type: "number" },
                        },
                        required: ["owner", "name"],
                    },
                },
            },
            required: ["key", "keywords", "file"],
        },
    },
    {
        name: "delete_project",
        description: "Remove a project entry from config.json. " +
            "Does NOT delete the context .md file from the claude-data store. " +
            "Call when the user types /project-end or asks to 'remove a project', 'delete a project', 'stop tracking a project', or similar. " +
            "Always confirm the key with the user before calling — this cannot be undone from within the tool.",
        inputSchema: {
            type: "object",
            properties: {
                key: { type: "string", description: "Project key to remove (e.g. 'courtquest')" },
            },
            required: ["key"],
        },
    },
    {
        name: "generate_instructions",
        description: "Generate a static custom instructions snippet for Claude.ai chat. " +
            "Output is ready to paste into Claude.ai Project settings. " +
            "Never needs updating — project names live in the MCP server, not the instructions.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "read_repo_file",
        description: "Fetch raw file content from a project's GitHub repo at HEAD. Use for in-context discussion of specific source files.",
        inputSchema: {
            type: "object",
            properties: {
                project: { type: "string", description: "Project key." },
                path: { type: "string", description: "File path within the repo (e.g. 'src/main.swift', 'README.md')." },
            },
            required: ["project", "path"],
        },
    },
];
const server = new Server({ name: "context-router", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    // Load fresh on every request — mutations (create/delete) write back to disk,
    // so subsequent reads always reflect the current state without a server restart.
    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    try {
        switch (name) {
            case "read_project": {
                const { keywords } = z.object({ keywords: z.array(z.string()).min(1) }).parse(args);
                return { content: [{ type: "text", text: await readProject(config, keywords) }] };
            }
            case "write_project": {
                const { project, content } = z.object({ project: z.string(), content: z.string() }).parse(args);
                return { content: [{ type: "text", text: await writeProject(config, project, content) }] };
            }
            case "list_projects": {
                return { content: [{ type: "text", text: listProjects(config) }] };
            }
            case "sync_from_repo": {
                const { project } = z.object({ project: z.string() }).parse(args);
                return { content: [{ type: "text", text: await syncFromRepo(config, project) }] };
            }
            case "create_project": {
                const input = z.object({
                    key: z.string(),
                    keywords: z.array(z.string()).min(1),
                    file: z.string(),
                    workingDirs: z.array(z.string()).default([]),
                    writeBack: z.boolean().default(true),
                    repos: z.array(z.object({
                        owner: z.string(),
                        name: z.string(),
                        branch: z.string().default("main"),
                        watchPaths: z.array(z.string()).default([]),
                        maxCommits: z.number().default(20),
                        lastSyncedCommit: z.string().default(""),
                    })).default([]),
                }).parse(args);
                const { key, ...project } = input;
                return { content: [{ type: "text", text: createProject(key, project, config, configPath) }] };
            }
            case "delete_project": {
                const { key } = z.object({ key: z.string() }).parse(args);
                return { content: [{ type: "text", text: deleteProject(key, config, configPath) }] };
            }
            case "generate_instructions": {
                return { content: [{ type: "text", text: generateInstructions(config) }] };
            }
            case "read_repo_file": {
                const { project, path } = z.object({ project: z.string(), path: z.string() }).parse(args);
                return { content: [{ type: "text", text: await readRepoFile(config, project, path) }] };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
        };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map