# context-router

A Claude plugin and MCP server that gives Claude persistent, cross-surface project memory. Load the right context for any project on demand — in Claude Code via `/route`, in the Claude desktop app via the MCP server, or in Claude.ai web chat via a generated custom instructions block. Write state back with `/context-router:project-sync`.

No more re-explaining context at the start of every session.


---

## How it works

All project context lives in a single private GitHub repo (`claude-data`). The plugin routes between projects by keyword scoring and directory matching — load the right file, write it back when you're done. Reads and writes go through the GitHub API by default; a local clone is optional and not recommended (see [Config reference](#config-reference)).

**Claude desktop app** — add the MCP server to `claude_desktop_config.json` (see [Desktop app setup](#desktop-app-setup)). All 8 tools are available natively — no custom instructions needed.

**Claude.ai web chat** — the web app cannot connect to local MCP servers. Run `/context-router:project-instructions` once to generate a custom instructions block and paste it into your Claude.ai Project settings. After that, `/route [project]` in any chat message triggers `read_project` reliably.

---

## Requirements
- Node.js 20+
- A private GitHub repo to use as your `claude-data` store
- A GitHub personal access token with `repo` scope

---

## Installation

### 1. Clone the plugin

```bash
git clone https://github.com/VProPlayer/context-router.git
cd context-router
npm install
```

### 2. Create your config

```bash
mkdir -p ~/.config/context-router
cp config.example.json ~/.config/context-router/config.json
```

Edit `~/.config/context-router/config.json`:

```json
{
  "claudeDataRepo": {
    "owner": "your-github-username",
    "name": "claude-data",
    "branch": "main"
  },
  "claudeDataLocal": "~/ClaudeData",
  "projects": {
    "my-project": {
      "keywords": ["MyProject", "MP", "relevant-term"],
      "file": "my-project.md",
      "writeBack": true
    }
  }
}
```

See [Config reference](#config-reference) for all options including repo sync.

### 3. Create a GitHub token

Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**. Enable the `repo` scope (required to read and write files in your private `claude-data` repo).

Add the token to `~/.zshrc` (or `~/.bashrc`):

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### 4. Create your claude-data repo

Create a **private** repo on GitHub named `claude-data` (or whatever you set in config).

The repo is a flat collection of `.md` files — one per project, all at the root:

```
claude-data/
├── my-project.md
├── another-project.md
└── ...
```

The `file` field in your config maps directly to the filename. Subfolders are supported (`"file": "work/my-project.md"`) but not required.

Push an initial file for each project you configured:

```bash
echo "# My Project\n\nProject context goes here." > my-project.md
git init && git add . && git commit -m "init" && git branch -M main
git remote add origin https://github.com/your-username/claude-data.git
git push -u origin main
```

> **Note:** A local clone (`claudeDataLocal`) is not required and not recommended — a stale or diverged clone can cause the plugin to read outdated context. The GitHub API is the default for all reads and writes. Only set `claudeDataLocal` if you have a specific offline use case and understand the trade-offs.

---

## Usage

---

### Desktop app setup

Add context-router to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "context-router": {
      "command": "node",
      "args": ["/path/to/context-router/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

The `env` block is required — the Claude desktop app does not inherit shell environment variables, so `GITHUB_TOKEN` must be passed explicitly here.

Restart the Claude desktop app. All 8 MCP tools will appear under `context-router` in any conversation.

### Desktop app usage

The desktop app has no plugin slash command system, but Claude responds to both slash-style text triggers and natural language. All of the following work:

**Load context:**
| Slash | Natural language |
|---|---|
| `/route courtquest` | "let's work on courtquest" |
| `/route` | "what projects do I have?" |

**Save context:**
| Slash | Natural language |
|---|---|
| `/save` | "update the context file" / "save my context" |

**Manage projects:**
| Slash | Natural language | Tool called |
|---|---|---|
| `/project-new` | "add a project" / "track a new project" | `create_project` |
| `/project-end` | "remove the courtquest project" / "stop tracking vv" | `delete_project` |
| `/project-sync` | "sync my repo" / "pull in recent commits" | `sync_from_repo` |

Claude will collect any required fields (key, keywords, file) before calling a tool, and will always confirm before writing or deleting.

---

### Claude.ai web chat setup

The Claude.ai web app cannot connect to local MCP servers. Use the generated custom instructions as a workaround.

Run this once in Claude Code:

```
/context-router:project-instructions
```

Copy the output and paste it into your Claude.ai Project instructions. The same slash triggers and natural language patterns from the desktop app table above apply here too. The instructions contain no project names or keywords — those live in the MCP server, so you never need to update them when adding or removing projects.

---

## Config reference

```json
{
  "claudeDataRepo": {
    "owner": "github-username",
    "name": "claude-data",
    "branch": "main"
  },
  "claudeDataLocal": "~/ClaudeData",
  "projects": {
    "project-key": {
      "keywords": ["Name", "Acronym", "domain-term"],
      "file": "project-key.md",
      "writeBack": true,
      "repo": {
        "owner": "github-username",
        "name": "project-repo",
        "branch": "main",
        "watchPaths": ["src/", "README.md"],
        "lastSyncedCommit": "",
        "maxCommits": 20
      }
    }
  }
}
```

| Field | Required | Description |
|---|---|---|
| `claudeDataRepo` | yes | GitHub repo holding your `.md` context files |
| `claudeDataLocal` | no | Local clone path. If set, reads/writes go here first; GitHub API is the fallback. **Not recommended** — a stale or diverged local clone can cause mismatches between what Claude reads and what's actually in the repo. Prefer omitting this and using the GitHub API exclusively for consistent reads. |
| `projects` | yes | Map of project key → config |
| `keywords` | yes | Topic signals for keyword routing. Include the project name, acronyms, and domain terms |
| `file` | yes | Filename in the claude-data store (e.g. `my-project.md`) |
| `writeBack` | no | Set to `false` to make the project read-only (default: `true`) |
| `repo` | no | Project's source code repo for `/project-sync` commit history |
| `repo.watchPaths` | no | Only report changes under these paths during sync (supports multiple repositories) |
| `repo.lastSyncedCommit` | no | SHA of last synced commit. Updated manually after each sync |
| `repo.maxCommits` | no | Cap on commits fetched per sync (default: 20) |

---

## MCP tools

These are available in Claude desktop app and Claude.ai web. On Claude.ai web, the `generate_instructions` tool produces a custom instructions block that approximates MCP tool access via text commands.

| Tool | Description |
|---|---|
| `read_project` | Score and load context file by keyword match |
| `write_project` | Write updated context → git commit → push |
| `list_projects` | Show all configured projects |
| `create_project` | Add a project to config.json |
| `delete_project` | Remove a project from config.json |
| `sync_from_repo` | Fetch commits + diffs from a project's source repo |
| `read_repo_file` | Read a file from a project's source repo at HEAD |
| `generate_instructions` | Generate Claude.ai custom instructions from current config |

---

## Removal

### Remove config and data

```bash
rm -rf ~/.config/context-router
```

Your `claude-data` repo and local clone are untouched — they're your data, not the plugin's.

### Uninstall Node packages

```bash
rm -rf /path/to/context-router/node_modules
```

Or delete the cloned directory entirely.

---

## Cross-surface behavior

| Surface | MCP tools | Slash commands | Write-back |
|---|---|---|---|
| Claude desktop app | Native (stdio) | `/route`, `/save` | GitHub API |
| Claude.ai web chat | Not supported — use custom instructions workaround | `/route`, `/save` (enforced by instructions) | GitHub API |

---

## License

MIT
