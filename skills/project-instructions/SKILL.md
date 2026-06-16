---
name: project-instructions
description: |
  Generate tailored Claude.ai custom instructions from the current config.
  Run after adding or removing projects to keep chat instructions in sync.
  Trigger: /context-router:project-instructions
user-invocable: true
---

Call `generate_instructions` and present the output to the user with these notes:

1. **Where to paste:** claude.ai → select a Project → Project instructions (or Settings → Custom instructions for account-level).

2. **Never needs updating:** The instructions contain no project names or keywords — those live in the MCP server. Paste once and forget it. Adding or removing projects via `/project-new` or `/project-end` requires no change to the instructions.

3. **How `/load` works in chat:** The instructions define `/load [project]` as a trigger phrase. In claude.ai, type `/load courtquest` (or any keyword) and Claude will call `read_project` immediately. No plugin required — it's enforced by the custom instructions.

4. **Write-back in chat:** Type `/save` or "update the context file" and Claude will call `write_project` after confirming. Same tool, same git push — works identically to Claude Code.

Present the generated block in a code fence so it's easy to select and copy.
