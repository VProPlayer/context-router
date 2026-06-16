---
name: project-new
description: |
  Guided flow to add a new project to context-router.
  Walks the user through required and optional fields, confirms before writing.
  Trigger: /context-router:project-new
user-invocable: true
---

Guide the user through creating a new context-router project. Collect the following fields conversationally — ask for all required ones up front, then optionals together:

**Required:**
- `key` — short lowercase identifier with hyphens (e.g. `my-project`). This is what you type in tools and config.
- `keywords` — 2–6 topic signals that trigger this project's context (project name, acronyms, technology names, domain terms).
- `file` — filename for the context file in the claude-data store (e.g. `my-project.md`). Default: `<key>.md`.

**Optional (ask as a group):**
- `workingDirs` — local directories that auto-load this context on session start. Leave empty to skip auto-loading.
- `writeBack` — whether `/project-sync` can write back to this project. Default: true.
- `repo` — GitHub repo to sync commit history from. If yes, collect: `owner/name`, `branch` (default: main), `watchPaths` (e.g. `src/`, `README.md`), `maxCommits` (default: 20).

**Flow:**
1. Ask for required fields.
2. Ask: "Any optional settings? (working dirs, repo sync, disable write-back)" — collect what the user provides, skip the rest.
3. Show a summary of all fields and ask for confirmation before writing.
4. On confirmation, call `create_project` with the collected values.
5. Remind the user to create `<file>` in their claude-data store with initial project context.

If the user is unsure about a field, suggest a sensible default and explain it briefly.
