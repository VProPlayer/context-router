import { z } from "zod";
export const RepoConfigSchema = z.object({
    owner: z.string(),
    name: z.string(),
    branch: z.string().default("main"),
    watchPaths: z.array(z.string()).default([]),
    lastSyncedCommit: z.string().default(""),
    maxCommits: z.number().int().positive().default(20),
});
export const ProjectSchema = z.object({
    keywords: z.array(z.string()).min(1),
    file: z.string(),
    workingDirs: z.array(z.string()).default([]),
    writeBack: z.boolean().default(true),
    repo: RepoConfigSchema.optional(),
});
export const ClaudeDataRepoSchema = z.object({
    owner: z.string(),
    name: z.string(),
    branch: z.string().default("main"),
});
export const ConfigSchema = z.object({
    claudeDataRepo: ClaudeDataRepoSchema,
    claudeDataLocal: z.string().optional(),
    projects: z.record(z.string(), ProjectSchema),
});
//# sourceMappingURL=schema.js.map