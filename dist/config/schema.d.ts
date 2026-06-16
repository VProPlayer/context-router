import { z } from "zod";
export declare const RepoConfigSchema: z.ZodObject<{
    owner: z.ZodString;
    name: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    watchPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    lastSyncedCommit: z.ZodDefault<z.ZodString>;
    maxCommits: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    name: string;
    branch: string;
    watchPaths: string[];
    lastSyncedCommit: string;
    maxCommits: number;
}, {
    owner: string;
    name: string;
    branch?: string | undefined;
    watchPaths?: string[] | undefined;
    lastSyncedCommit?: string | undefined;
    maxCommits?: number | undefined;
}>;
export declare const ProjectSchema: z.ZodObject<{
    keywords: z.ZodArray<z.ZodString, "many">;
    file: z.ZodString;
    workingDirs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    writeBack: z.ZodDefault<z.ZodBoolean>;
    repos: z.ZodDefault<z.ZodArray<z.ZodObject<{
        owner: z.ZodString;
        name: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
        watchPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        lastSyncedCommit: z.ZodDefault<z.ZodString>;
        maxCommits: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        name: string;
        branch: string;
        watchPaths: string[];
        lastSyncedCommit: string;
        maxCommits: number;
    }, {
        owner: string;
        name: string;
        branch?: string | undefined;
        watchPaths?: string[] | undefined;
        lastSyncedCommit?: string | undefined;
        maxCommits?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    keywords: string[];
    file: string;
    workingDirs: string[];
    writeBack: boolean;
    repos: {
        owner: string;
        name: string;
        branch: string;
        watchPaths: string[];
        lastSyncedCommit: string;
        maxCommits: number;
    }[];
}, {
    keywords: string[];
    file: string;
    workingDirs?: string[] | undefined;
    writeBack?: boolean | undefined;
    repos?: {
        owner: string;
        name: string;
        branch?: string | undefined;
        watchPaths?: string[] | undefined;
        lastSyncedCommit?: string | undefined;
        maxCommits?: number | undefined;
    }[] | undefined;
}>;
export declare const ClaudeDataRepoSchema: z.ZodObject<{
    owner: z.ZodString;
    name: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    name: string;
    branch: string;
}, {
    owner: string;
    name: string;
    branch?: string | undefined;
}>;
export declare const ConfigSchema: z.ZodObject<{
    claudeDataRepo: z.ZodObject<{
        owner: z.ZodString;
        name: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        name: string;
        branch: string;
    }, {
        owner: string;
        name: string;
        branch?: string | undefined;
    }>;
    claudeDataLocal: z.ZodOptional<z.ZodString>;
    projects: z.ZodRecord<z.ZodString, z.ZodObject<{
        keywords: z.ZodArray<z.ZodString, "many">;
        file: z.ZodString;
        workingDirs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        writeBack: z.ZodDefault<z.ZodBoolean>;
        repos: z.ZodDefault<z.ZodArray<z.ZodObject<{
            owner: z.ZodString;
            name: z.ZodString;
            branch: z.ZodDefault<z.ZodString>;
            watchPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            lastSyncedCommit: z.ZodDefault<z.ZodString>;
            maxCommits: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            name: string;
            branch: string;
            watchPaths: string[];
            lastSyncedCommit: string;
            maxCommits: number;
        }, {
            owner: string;
            name: string;
            branch?: string | undefined;
            watchPaths?: string[] | undefined;
            lastSyncedCommit?: string | undefined;
            maxCommits?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        keywords: string[];
        file: string;
        workingDirs: string[];
        writeBack: boolean;
        repos: {
            owner: string;
            name: string;
            branch: string;
            watchPaths: string[];
            lastSyncedCommit: string;
            maxCommits: number;
        }[];
    }, {
        keywords: string[];
        file: string;
        workingDirs?: string[] | undefined;
        writeBack?: boolean | undefined;
        repos?: {
            owner: string;
            name: string;
            branch?: string | undefined;
            watchPaths?: string[] | undefined;
            lastSyncedCommit?: string | undefined;
            maxCommits?: number | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    claudeDataRepo: {
        owner: string;
        name: string;
        branch: string;
    };
    projects: Record<string, {
        keywords: string[];
        file: string;
        workingDirs: string[];
        writeBack: boolean;
        repos: {
            owner: string;
            name: string;
            branch: string;
            watchPaths: string[];
            lastSyncedCommit: string;
            maxCommits: number;
        }[];
    }>;
    claudeDataLocal?: string | undefined;
}, {
    claudeDataRepo: {
        owner: string;
        name: string;
        branch?: string | undefined;
    };
    projects: Record<string, {
        keywords: string[];
        file: string;
        workingDirs?: string[] | undefined;
        writeBack?: boolean | undefined;
        repos?: {
            owner: string;
            name: string;
            branch?: string | undefined;
            watchPaths?: string[] | undefined;
            lastSyncedCommit?: string | undefined;
            maxCommits?: number | undefined;
        }[] | undefined;
    }>;
    claudeDataLocal?: string | undefined;
}>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Config = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=schema.d.ts.map