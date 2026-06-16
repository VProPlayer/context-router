---
name: project-end
description: |
  Remove a project from context-router routing. Only removes the config entry —
  the context .md file in the claude-data store is never touched.
  Requires explicit confirmation before writing.
  Trigger: /context-router:project-end
user-invocable: true
---

Guide the user through removing a project from context-router.

**Flow:**
1. If no project key was given, call `list_projects` and ask which one to remove.
2. Confirm the key exists and show what will be removed:
   - Keywords that will stop triggering
   - Working dirs that will stop auto-loading
   - Whether a repo was configured
3. State clearly: **the `.md` file in the claude-data store is NOT deleted** — only the routing config entry is removed. The user must delete the file manually if they want it gone.
4. Ask for explicit confirmation: "Remove project `<key>` from context-router? (yes/no)"
5. On confirmation, call `delete_project` with the key.
6. If the user also wants to delete the context file, remind them to remove `<file>` from their claude-data repo manually.

Do not call `delete_project` without an explicit "yes" from the user.
