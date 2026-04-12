const { Octokit } = require('octokit');
const getGitHubData = async (url) => {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    try {
        const pathParts = new URL(url).pathname.split('/').filter(p => p);
        
        if (pathParts.length === 1) {
            const username = pathParts[0];
            const { data: user } = await octokit.rest.users.getByUsername({ username });
            const { data: repos } = await octokit.rest.repos.listForUser({ 
                username, 
                sort: 'pushed', 
                per_page: 5 
            });

            return {
                type: 'user',
                data: {
                    profile: user,
                    topRepos: repos.map(r => ({
                        name: r.name,
                        description: r.description,
                        language: r.language,
                        stars: r.stargazers_count,
                        url: r.html_url
                    }))
                }
            };
        } else if (pathParts.length >= 2) {
            const owner = pathParts[0];
            const repo = pathParts[1];

            const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
            
            let readmeContent = '';
            try {
                const { data: readme } = await octokit.rest.repos.getReadme({ owner, repo });
                readmeContent = Buffer.from(readme.content, 'base64').toString();
            } catch (e) {
                readmeContent = 'No README found.';
            }
            const { data: tree } = await octokit.rest.git.getTree({
                owner,
                repo,
                tree_sha: repoData.default_branch,
                recursive: true
            });

            const structure = tree.tree
                .filter(item => !item.path.includes('node_modules') && !item.path.includes('.git'))
                .slice(0, 50)
                .map(item => item.path);

            return {
                type: 'repo',
                data: {
                    details: repoData,
                    readme: readmeContent,
                    structure: structure,
                    languages: repoData.language
                }
            };
        } else {
            throw new Error('Invalid GitHub URL');
        }
    } catch (error) {
        console.error('GitHub API Error:', error);
        throw new Error('Failed to fetch data from GitHub. Check the URL or the repo is private.');
    }
};
module.exports = { getGitHubData };
