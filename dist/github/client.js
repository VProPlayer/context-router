import { Octokit } from "@octokit/rest";
let _client = null;
export function getGitHubClient() {
    if (_client)
        return _client;
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error("GITHUB_TOKEN environment variable is required. " +
            "Set it in your shell profile or pass it via CLAUDE_MCP_ENV.");
    }
    _client = new Octokit({ auth: token });
    return _client;
}
//# sourceMappingURL=client.js.map