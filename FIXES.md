## Refactor Issues — 2026-06-16

- [x] `src/tools/create-project.ts:7-11` and `src/tools/delete-project.ts:6-10` — `DEFAULT_CONFIG_PATH` constant and `getConfigPath()` function duplicated verbatim in both files; moved to `src/utils/path.ts`
- [x] `src/tools/create-project.ts:22-33` and `src/tools/delete-project.ts:12-19` — Config read-from-disk pattern duplicated: both manually called `readFileSync` + `JSON.parse` + `ConfigSchema.parse`; now receive `config` + `configPath` from server, which loads fresh per request via `loadConfig()`
- [x] `src/tools/read-project.ts:46-50` and `src/tools/read-repo-file.ts:16-17` — Base64 GitHub content decode duplicated; consolidated into `decodeGitHubContent()` in `src/github/client.ts`
- [x] `src/tools/read-project.ts:6-7` and `src/tools/write-project.ts:6-7` — Repeated `getGitHubClient()` + `claudeDataRepo` destructuring; consolidated into `getClaudeDataFile()` and `getClaudeDataFileSha()` in `src/github/client.ts`
- [x] `src/tools/read-project.ts:43-44` and `src/tools/write-project.ts:34` — `gh.repos.getContent` called with same shape in both; absorbed by `getClaudeDataFile()` helper
- [x] `src/tools/create-project.ts:46-55` and `src/tools/delete-project.ts:32-41` — Hand-constructed response strings; now consistent in structure across both tools
- [x] `src/index.ts:164-223` — 60-line switch with inline Zod parsing; extracted tool definitions to `TOOLS` const, config loaded fresh per request at top of handler
- [x] `src/tools/sync-from-repo.ts:29-78` — Monolithic function; split into `fetchWatchedDiff()` and `formatDiff()` helpers
- [x] `src/tools/write-project.ts:13-23` — Single catch for all git steps; each step (`git add`, `git commit`, `git push`) now has its own try/catch with a descriptive error label
- [x] `src/config/loader.ts:23-25` — `expandHome` misplaced in loader; moved to `src/utils/path.ts`, re-exported from loader for compatibility
