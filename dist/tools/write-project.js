import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { getGitHubClient } from "../github/client.js";
import { expandHome } from "../config/loader.js";
export async function writeProject(config, projectKey, content) {
    const project = config.projects[projectKey];
    if (!project)
        throw new Error(`Unknown project: "${projectKey}". Run list_projects to see available keys.`);
    if (!project.writeBack)
        throw new Error(`Write-back is disabled for project: ${projectKey}`);
    if (config.claudeDataLocal) {
        const localDir = expandHome(config.claudeDataLocal);
        const filePath = resolve(localDir, project.file);
        try {
            writeFileSync(filePath, content, "utf-8");
            execSync(`git -C "${localDir}" add "${project.file}"`, { stdio: "pipe" });
            execSync(`git -C "${localDir}" commit -m "context-router: update ${project.file}"`, { stdio: "pipe" });
            execSync(`git -C "${localDir}" push`, { stdio: "pipe" });
            return `Written and pushed: ${project.file}`;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`Local write/push failed for ${project.file}: ${msg}`);
        }
    }
    // GitHub API path (mobile / no local clone)
    const gh = getGitHubClient();
    const { claudeDataRepo: repo } = config;
    let sha;
    try {
        const existing = await gh.repos.getContent({ owner: repo.owner, repo: repo.name, path: project.file, ref: repo.branch });
        if (!Array.isArray(existing.data) && "sha" in existing.data) {
            sha = existing.data.sha;
        }
    }
    catch {
        // file doesn't exist yet — create it
    }
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