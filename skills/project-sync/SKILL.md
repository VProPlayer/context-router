---
name: project-sync
description: |
  Deliberate write-back skill. Triggered only by explicit user instruction:
  "/project-sync", "update the context file", "save this session", "write back".
  Never invoked automatically. Requires user intent.
user-invocable: true
---

When the user explicitly requests a project context update:

1. **Read current state** — call `read_project` with the active project's keywords to get the current .md content.

2. **Sync repo delta** (if repo configured) — call `sync_from_repo` for the active project. Review the commit summary and diffs for architecturally significant changes.

3. **Merge** — synthesize:
   - Current conversation state (decisions made, problems solved, open questions)
   - Repo delta from step 2 (fold in significant technical changes)
   - Existing .md content from step 1
   Keep the file readable narrative, not a changelog dump. Preserve section structure.

4. **Write back** — call `write_project` with the project key and merged content. Confirm the result to the user.

5. **Update lastSyncedCommit** — remind the user to update `lastSyncedCommit` in their `config.json` to the SHA reported by `sync_from_repo`.

Use `/context-router:project-sync` to invoke.
