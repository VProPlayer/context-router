import { Octokit } from "@octokit/rest";
import type { Config } from "../config/schema.js";
export declare function getGitHubClient(): Octokit;
export declare function decodeGitHubContent(content: unknown): string;
export declare function getClaudeDataFile(config: Config, filePath: string): Promise<string>;
export declare function getClaudeDataFileSha(config: Config, filePath: string): Promise<string | undefined>;
//# sourceMappingURL=client.d.ts.map