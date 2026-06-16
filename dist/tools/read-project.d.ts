import type { Config } from "../config/schema.js";
export declare function readProject(config: Config, keywords: string[]): Promise<string>;
export declare function matchProjectByDir(config: Config, cwd: string): {
    key: string;
    file: string;
} | null;
//# sourceMappingURL=read-project.d.ts.map