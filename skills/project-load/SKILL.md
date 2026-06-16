---
name: project-load
description: |
  Auto-load project context when the user mentions a project by name, acronym, or domain term
  and no context has been injected via the SessionStart hook (i.e. no cwd match).
  Triggers on topic signals mid-session: project names, technology terms, or acronyms
  that correspond to a configured project.
  Calls read_project MCP tool with extracted keywords to score and load the best match.
  Do NOT trigger if project context is already in the conversation.
---

When you detect topic signals that match a known project (project name, acronym, or domain keyword) and no project context has been loaded yet, call `read_project` with the relevant keywords extracted from the conversation.

Extract 2–5 keywords from what the user said. Examples:
- "let's work on CourtQuest" → `["CourtQuest", "CQ"]`
- "back to the RAG pipeline" → `["RAG", "Ollama", "vv"]`
- "FOIA scraping issue" → `["FOIA", "CourtQuest", "CV pipeline"]`

After loading, confirm to the user which project was loaded and proceed with their request.
