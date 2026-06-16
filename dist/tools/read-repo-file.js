import { getGitHubClient, decodeGitHubContent } from "../github/client.js";
export async function readRepoFile(config, projectKey, path) {
    const project = config.projects[projectKey];
    if (!project)
        throw new Error(`Unknown project: "${projectKey}"`);
    if (!project.repo)
        throw new Error(`No repo configured for project: ${projectKey}`);
    const gh = getGitHubClient();
    const { owner, name, branch } = project.repo;
    const { data } = await gh.repos.getContent({ owner, repo: name, path, ref: branch });
    if (Array.isArray(data))
        throw new Error(`Path "${path}" is a directory. Specify a file path.`);
    if (!("content" in data))
        throw new Error(`No content at path: ${path}`);
    return decodeGitHubContent(data.content);
}
//# sourceMappingURL=read-repo-file.js.map