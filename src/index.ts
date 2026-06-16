import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadConfig } from "./config/loader.js";
import { readProject } from "./tools/read-project.js";
import { writeProject } from "./tools/write-project.js";
import { listProjects } from "./tools/list-projects.js";
import { syncFromRepo } from "./tools/sync-from-repo.js";
import { readRepoFile } from "./tools/read-repo-file.js";
import { createProject } from "./tools/create-project.js";
import { deleteProject } from "./tools/delete-project.js";
import { generateInstructions } from "./tools/generate-instructions.js";

const config = loadConfig();

const server = new Server(
  { name: "context-router", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_project",
      description:
        "Load the most relevant project context file by scoring keyword matches. " +
        "Use when the user mentions a project by name, acronym, or topic. " +
        "Returns the full .md content for the best-matching project.",
      inputSchema: {
        type: "object" as const,
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
      description:
        "Write updated project context back to the canonical store. " +
        "On desktop (claudeDataLocal set): writes file, git commits, and pushes atomically. " +
        "On mobile: commits via GitHub API. " +
        "Only call after explicit user instruction ('update the context file', '/project-sync').",
      inputSchema: {
        type: "object" as const,
        properties: {
          project: { type: "string", description: "Project key (e.g. 'courtquest'). Use list_projects to confirm." },
          content: { type: "string", description: "Full updated markdown content for the project file." },
        },
        required: ["project", "content"],
      },
    },
    {
      name: "list_projects",
      description: "List all configured projects — keys, keywords, files, working directories, and repo info.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "sync_from_repo",
      description:
        "Fetch commits and diffs from a project's GitHub repo since the last sync. " +
        "Returns a structured markdown summary for Claude to merge into the project .md. " +
        "Claude does the merge — this tool provides raw delta only.",
      inputSchema: {
        type: "object" as const,
        properties: {
          project: { type: "string", description: "Project key to sync repo state for." },
        },
        required: ["project"],
      },
    },
    {
      name: "create_project",
      description:
        "Add a new project entry to config.json. " +
        "Validates the schema, checks for duplicate keys, and writes atomically. " +
        "Only call after confirming all fields with the user via /project-new.",
      inputSchema: {
        type: "object" as const,
        properties: {
          key: {
            type: "string",
            description: "Project identifier — lowercase alphanumeric with hyphens (e.g. 'my-project')",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Topic signals that trigger this project's context (project name, acronyms, domain terms)",
          },
          file: {
            type: "string",
            description: "Filename in the claude-data store (e.g. 'my-project.md')",
          },
          workingDirs: {
            type: "array",
            items: { type: "string" },
            description: "Local directories that auto-load this context on session start (e.g. ['~/Developer/my-project'])",
          },
          writeBack: {
            type: "boolean",
            description: "Whether /project-sync can write back to this project's file (default: true)",
          },
          repo: {
            type: "object",
            description: "Optional GitHub repo to sync commits from",
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
        required: ["key", "keywords", "file"],
      },
    },
    {
      name: "generate_instructions",
      description:
        "Generate a custom instructions snippet for Claude.ai chat, tailored to the current project config. " +
        "Output is ready to paste into Claude.ai Project settings. " +
        "Re-run after adding or removing projects to keep instructions in sync.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "delete_project",
      description:
        "Remove a project entry from config.json. " +
        "Does NOT delete the context .md file from the claude-data store — only the routing config entry is removed. " +
        "Only call after explicit user confirmation via /project-end.",
      inputSchema: {
        type: "object" as const,
        properties: {
          key: { type: "string", description: "Project key to remove (e.g. 'courtquest')" },
        },
        required: ["key"],
      },
    },
    {
      name: "read_repo_file",
      description: "Fetch raw file content from a project's GitHub repo at HEAD. Use for in-context discussion of specific source files.",
      inputSchema: {
        type: "object" as const,
        properties: {
          project: { type: "string", description: "Project key." },
          path: { type: "string", description: "File path within the repo (e.g. 'src/main.swift', 'README.md')." },
        },
        required: ["project", "path"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    switch (name) {
      case "read_project": {
        const { keywords } = z.object({ keywords: z.array(z.string()).min(1) }).parse(args);
        return { content: [{ type: "text" as const, text: await readProject(config, keywords) }] };
      }
      case "write_project": {
        const { project, content } = z.object({ project: z.string(), content: z.string() }).parse(args);
        return { content: [{ type: "text" as const, text: await writeProject(config, project, content) }] };
      }
      case "list_projects": {
        return { content: [{ type: "text" as const, text: listProjects(config) }] };
      }
      case "sync_from_repo": {
        const { project } = z.object({ project: z.string() }).parse(args);
        return { content: [{ type: "text" as const, text: await syncFromRepo(config, project) }] };
      }
      case "create_project": {
        const input = z.object({
          key: z.string(),
          keywords: z.array(z.string()).min(1),
          file: z.string(),
          workingDirs: z.array(z.string()).default([]),
          writeBack: z.boolean().default(true),
          repo: z.object({
            owner: z.string(),
            name: z.string(),
            branch: z.string().default("main"),
            watchPaths: z.array(z.string()).default([]),
            maxCommits: z.number().default(20),
            lastSyncedCommit: z.string().default(""),
          }).optional(),
        }).parse(args);
        const { key, ...project } = input;
        return { content: [{ type: "text" as const, text: createProject(key, project) }] };
      }
      case "generate_instructions": {
        return { content: [{ type: "text" as const, text: generateInstructions(config) }] };
      }
      case "delete_project": {
        const { key } = z.object({ key: z.string() }).parse(args);
        return { content: [{ type: "text" as const, text: deleteProject(key) }] };
      }
      case "read_repo_file": {
        const { project, path } = z.object({ project: z.string(), path: z.string() }).parse(args);
        return { content: [{ type: "text" as const, text: await readRepoFile(config, project, path) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
