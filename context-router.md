# context-router

## Status
**Phase:** Architecture complete / Pre-build
**Stage:** Plugin + MCP design finalized. No code written yet.
**Last Updated:** June 2026

---

## What It Is
A distributable Claude Code plugin + MCP server that implements automatic, cross-surface project memory routing. Claude reads the right project file based on working directory (Claude Code) or topic signals (chat/Cowork), and writes state changes back on demand. No manual prompting required in normal operation.

---

## Problem Being Solved
- Claude Projects load all context always — no routing, no write-back, static uploads
- No published tool does: multi-project keyword routing + live file state + write-back + cross-surface
- Claude Code plugin system (stable since Oct 2025) enables sessionStart hooks and auto-invoke skills — the right primitive for zero-friction context injection
- The pattern is already working in production (the ClaudeData system) — this packages it for general use

---

## Canonical Store: claude-data Private GitHub Repo

All `.md` context files live in a single private GitHub repo (`vedantchaudhari/claude-data`). Single source of truth across all surfaces.

```
vedantchaudhari/claude-data (private)
├── courtquest.md
├── vv.md
├── tkd-ai.md
├── internship-finder.md
├── context-router.md
└── custom-instructions.md
```

| Surface | Read | Write |
|---|---|---|
| Desktop | Local clone at `~/ClaudeData/` (fast, offline) | Write local → `git commit` → `git push`, every write |
| Mobile | GitHub API (`claude-data` repo) | GitHub API commit |
| Repo sync | GitHub API (project repos) | Never — read-only |

Desktop discipline: every `write_project` call is atomic — update file, `git add`, `git commit`, `git push`. No manual pushing. The `session-start.sh` hook runs `git pull` at the top of every Claude Code session to stay current.

---

## Architecture

### Plugin Directory Structure

```
context-router/
├── .claude-plugin/
│   └── plugin.json
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── tools/
│   │   ├── read-project.ts
│   │   ├── write-project.ts
│   │   ├── list-projects.ts
│   │   ├── sync-from-repo.ts
│   │   └── read-repo-file.ts
│   ├── github/
│   │   └── client.ts
│   └── config/
│       ├── loader.ts
│       └── schema.ts
├── skills/
│   ├── project-load/
│   │   └── SKILL.md        (auto-invoke: true — keyword routing)
│   └── project-sync/
│       └── SKILL.md        (disable-model-invocation: true — /project-sync)
├── hooks/
│   └── session-start.sh    (git pull + cwd → workingDirs match → additionalContext inject)
├── .mcp.json
├── package.json
├── tsconfig.json
├── config.example.json
└── README.md
```

### Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Standard for MCP servers; official SDK is TS-first |
| MCP SDK | `@modelcontextprotocol/sdk` | Official, handles transport + tool registration |
| GitHub client | `@octokit/rest` | Typed, covers all tools needed |
| Config validation | `zod` | Schema + runtime type safety on `config.json` |
| Runtime | `node` (compiled JS) | Distribution target; `tsx` for dev |
| Distribution | npm + GitHub | `npx context-router init` for install |

### Config Schema (`config.json`)

```json
{
  "claudeDataRepo": {
    "owner": "vedantchaudhari",
    "name": "claude-data",
    "branch": "main"
  },
  "projects": {
    "courtquest": {
      "keywords": ["CourtQuest", "CQ", "CV pipeline", "FOIA"],
      "file": "courtquest.md",
      "workingDirs": ["~/Developer/cq-swift-app"],
      "writeBack": true,
      "repo": {
        "owner": "vedantchaudhari",
        "name": "cq-swift-app",
        "branch": "main",
        "watchPaths": ["src/", "README.md"],
        "lastSyncedCommit": "",
        "maxCommits": 20
      }
    },
    "vv": {
      "keywords": ["VV", "RAG", "Ollama", "DSPy", "Presidio"],
      "file": "vv.md",
      "workingDirs": ["~/Developer/vv"],
      "writeBack": true,
      "repo": {
        "owner": "vedantchaudhari",
        "name": "vv",
        "branch": "main",
        "watchPaths": ["src/", "README.md"],
        "lastSyncedCommit": "",
        "maxCommits": 20
      }
    }
  }
}
```

### MCP Tools

| Tool | Input | Purpose |
|---|---|---|
| `read_project` | `keywords: string[]` | Score matches, return relevant file content |
| `write_project` | `project: string, content: string` | Write local → commit → push (desktop) or GitHub API commit (mobile) |
| `list_projects` | — | Return config summary for Claude to reason over |
| `sync_from_repo` | `project: string` | Fetch commits since `lastSyncedCommit`, diff `watchPaths` (capped at `maxCommits`), return structured summary for Claude to merge into `.md` |
| `read_repo_file` | `project: string, path: string` | Fetch raw file content from project repo at HEAD for in-context discussion |

---

## Automation Behavior by Surface

### Claude Code (full automation)
1. `sessionStart` hook fires → `git pull` on `~/ClaudeData/` → reads cwd → matches `workingDirs` → injects file as `additionalContext`
2. `project-load` skill (auto-invoke: true) fires mid-session on topic signals without a cwd match
3. `/project-sync` slash command (disable-model-invocation: true) triggers deliberate write-back — no accidental mutations
4. `/repo-file <path>` calls `read_repo_file` → drops content into context for discussion

### Claude.ai Chat + Cowork
- MCP server available; no hooks
- Custom instructions template tells Claude to call `read_project` when topic signals appear
- Write-back via natural language: "update the context file" → Claude calls `write_project`
- Mobile reads/writes via GitHub API — no local filesystem required

### `/project-sync` Flow (with repo configured)
1. Read current `.md` state
2. If repo configured: `sync_from_repo` → get commits since `lastSyncedCommit` (max: `maxCommits`) → diff `watchPaths`
3. Claude merges conversation state + repo delta into updated `.md`
4. `write_project` (local write → commit → push)
5. Update `lastSyncedCommit` in config

Key principle: Claude does the merge, not the tool. The tool fetches raw diff data; Claude interprets what is architecturally significant and folds it into the narrative of the project file. The `.md` stays readable, not a changelog dump.

---

## Open Questions / Known Issues
- **Keyword scoring:** Substring match may produce false positives — may need weighted or fuzzy scoring
- **Write-back safety:** `/project-sync` is deliberate; chat write-back via natural language needs a confirmation guard
- **`watchPaths` noise:** `maxCommits` cap helps but large infrequently-synced repos still produce noisy diffs

---

## Distribution Plan

| Phase | Action |
|---|---|
| V1 | Publish to GitHub — install via git URL in Claude Code |
| V2 | Submit to `claude-community` — reviewed community directory |
| V3 | Submit to `claude-plugins-official` — Anthropic curated directory |
| Bonus | List on claudepluginhub.com — instant indexing via GitHub URL submission |

---

## Next Steps (Build Order)
1. Create `vedantchaudhari/claude-data` private repo — push existing ClaudeData files
2. Scaffold TypeScript project — `package.json`, `tsconfig.json`, `plugin.json`
3. Zod config schema — validate `config.json` shape
4. MCP server — `read_project`, `write_project`, `list_projects`
5. GitHub client (`@octokit/rest`) — `sync_from_repo`, `read_repo_file`, commit/push for write-back
6. `session-start.sh` hook — `git pull` + cwd matching + `additionalContext` injection
7. `project-load` skill — keyword routing SKILL.md, auto-invoke config
8. `project-sync` skill — write-back SKILL.md, slash command + `/repo-file` wiring
9. README with custom instructions template for chat/Cowork users
10. Publish to GitHub → submit to `claude-community`

---

## Positioning
- Distributable as a GitHub repo + npm package (`npx context-router init`)
- Target users: developers with multiple active projects who use Claude Code + claude.ai
- Differentiator: only tool combining keyword routing + live file state + write-back + cross-surface + repo sync (confirmed via web search, June 2026)

*Created: June 2026 | Updated: June 2026*
