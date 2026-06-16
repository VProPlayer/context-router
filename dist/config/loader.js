import { readFileSync } from "node:fs";
import { ConfigSchema } from "./schema.js";
import { getConfigPath } from "../utils/path.js";
export { expandHome } from "../utils/path.js";
export function loadConfig(configPath) {
    const path = configPath ?? getConfigPath();
    let raw;
    try {
        raw = JSON.parse(readFileSync(path, "utf-8"));
    }
    catch (err) {
        throw new Error(`Failed to read config at ${path}. ` +
            `Set CONTEXT_ROUTER_CONFIG or create ~/.config/context-router/config.json. ` +
            `See config.example.json for the schema. (${err instanceof Error ? err.message : err})`);
    }
    return ConfigSchema.parse(raw);
}
//# sourceMappingURL=loader.js.map