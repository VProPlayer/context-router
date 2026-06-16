# context-router

A Claude Code plugin and MCP server that gives Claude persistent, cross-surface project memory. Load the right context for any project on demand — in Claude Code via `/load`, in Claude.ai chat via a generated custom instructions block. Write state back with `/context-router:project-sync`.

No more re-explaining context at the start of every session.

---

## How it works

All project context lives in a single private GitHub repo (`claude-data`). On desktop, a local clone keeps reads fast and offline. The plugin routes between projects by keyword scoring and directory matching — load the right file, write it back when you're done.

**Claude Code** — `/load` is the single entry point for both project context and codebase loading. It checks the current directory for a matching project, loads its context file first, then reads the codebase as normal. `/context-router:project-sync` merges session state + recent repo commits back into the context file and pushes atomically.

**Claude.ai chat** — run `/context-router:project-instructions` once to generate a custom instructions block. Paste it into your Claude.ai Project settings. After that, `/load [project]` in any chat message triggers `read_project` reliably.

At session start, the plugin runs `git pull` on your local clone (if configured) so it stays current. All reads and writes go through the GitHub API by default — see [Config reference](#config-reference) for the `claudeDataLocal` trade-offs.

---

## Requirements

- [Claude Code](https://claude.ai/code) (plugin system, stable since Oct 2025)
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
      "workingDirs": ["~/Developer/my-project"],
      "writeBack": true
    }
  }
}
```

See [Config reference](#config-reference) for all options including repo sync.

### 3. Set your GitHub token

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### 4. Create your claude-data repo

Create a **private** repo on GitHub named `claude-data` (or whatever you set in config). Clone it to the path you set in `claudeDataLocal`:

```bash
git clone https://github.com/your-username/claude-data.git ~/ClaudeData
```

Create a `.md` file for each project you configured:

```bash
echo "# My Project\n\nProject context goes here." > ~/ClaudeData/my-project.md
cd ~/ClaudeData && git add . && git commit -m "init" && git push
```

### 5. Install the plugin in Claude Code

In Claude Code, open settings and add the plugin directory:

```json
{
  "plugins": [
    "/path/to/context-router"
  ]
}
```

Or install via the Claude Code plugin manager using the repo URL.

---

## Usage

### Loading context

`/load` is the single command for both project context and codebase loading. It tries to load project context first (by matching the current directory or keywords you pass), then reads the codebase as normal.

```
/load                  ← matches cwd to a project, then reads codebase
/load courtquest       ← loads courtquest context, then reads codebase
/load vv               ← loads vv context, then reads codebase
```

If the current directory doesn't match any configured project and no keyword is passed, `/load` skips project context silently and proceeds to codebase loading.

### Writing context back

After a session where you made decisions, solved problems, or made architectural changes:

```
/context-router:project-sync
```

This reads the current context file, optionally pulls recent repo commits, merges the session state in, and pushes the updated file. Claude does the merge — the file stays readable narrative, not a changelog dump.

### Managing projects

```
/context-router:project-new       ← guided flow to add a project
/context-router:project-end       ← remove a project (config only, .md file untouched)
```

### Claude.ai chat setup

Run this once:

```
/context-router:project-instructions
```

Copy the output and paste it into your Claude.ai Project instructions. After that, in any chat:

```
/load my-project        ← calls read_project immediately
/load                   ← lists projects and asks which to load
/save                   ← triggers write_project with confirmation
```

The instructions contain no project names or keywords — those live in the MCP server. You never need to update the pasted instructions when adding or removing projects.

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
      "workingDirs": ["~/Developer/project-dir"],
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
| `workingDirs` | no | Directories that trigger this project in `/load` |
| `writeBack` | no | Set to `false` to make the project read-only (default: `true`) |
| `repo` | no | Project's source code repo for `/project-sync` commit history |
| `repo.watchPaths` | no | Only report changes under these paths during sync |
| `repo.lastSyncedCommit` | no | SHA of last synced commit. Updated manually after each sync |
| `repo.maxCommits` | no | Cap on commits fetched per sync (default: 20) |

---

## MCP tools

These are available directly in Claude Code and any claude.ai surface with the MCP server connected:

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

### Remove the plugin from Claude Code

Remove the entry from your `plugins` array in Claude Code settings. The plugin stops running immediately.

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

| Surface | Auto-load | Slash commands | Write-back |
|---|---|---|---|
| Claude Code | `/load` (checks cwd, then reads codebase) | `/load [project]`, `/context-router:project-sync`, `/context-router:project-new`, `/context-router:project-end`, `/context-router:project-instructions` | Local git push |
| Claude.ai chat | Keyword detection via custom instructions | `/load`, `/save` (enforced by instructions) | GitHub API |
| Claude.ai Cowork | Keyword detection via custom instructions | Same as chat | GitHub API |

---

## License

MIT
