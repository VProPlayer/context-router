import { resolve } from "node:path";
import { homedir } from "node:os";
export const DEFAULT_CONFIG_PATH = resolve(homedir(), ".config", "context-router", "config.json");
export function expandHome(p) {
    return p.startsWith("~/") ? resolve(homedir(), p.slice(2)) : p;
}
export function getConfigPath() {
    return process.env.CONTEXT_ROUTER_CONFIG ?? DEFAULT_CONFIG_PATH;
}
//# sourceMappingURL=path.js.map