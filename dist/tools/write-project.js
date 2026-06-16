import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { getGitHubClient, getClaudeDataFileSha } from "../github/client.js";
import { expandHome } from "../utils/path.js";
export async function writeProject(config, projectKey, content) {
    const project = config.projects[projectKey];
    if (!project)
        throw new Error(`Unknown project: "${projectKey}". Run list_projects to see available keys.`);
    if (!project.writeBack)
        throw new Error(`Write-back is disabled for project: ${projectKey}`);
    if (config.claudeDataLocal) {
        const localDir = expandHome(config.claudeDataLocal);
        const filePath = resolve(localDir, project.file);
        const steps = [
            [`git -C "${localDir}" add "${project.file}"`, "git add"],
            [`git -C "${localDir}" commit -m "context-router: update ${project.file}"`, "git commit"],
            [`git -C "${localDir}" push`, "git push"],
        ];
        writeFileSync(filePath, content, "utf-8");
        for (const [cmd, label] of steps) {
            try {
                execSync(cmd, { stdio: "pipe" });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                throw new Error(`${label} failed for ${project.file}: ${msg}`);
            }
        }
        return `Written and pushed: ${project.file}`;
    }
    const gh = getGitHubClient();
    const { claudeDataRepo: repo } = config;
    const sha = await getClaudeDataFileSha(config, project.file);
    await gh.repos.createOrUpdateFileContents({
        owner: repo.owner,
        repo: repo.name,
        path: project.file,
        message: `context-router: update ${project.file}`,
        content: Buffer.from(content).toString("base64"),
        branch: repo.branch,
        sha,
    });
    return `Written via GitHub API: ${project.file}`;
}
//# sourceMappingURL=write-project.js.map