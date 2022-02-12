import * as core from '@actions/core';
import * as github from '@actions/github';

function getRepo(): string {
  const repo = core.getInput('repo');
  if (repo) {
    return repo;
  }
  if (!process.env.GITHUB_REPOSITORY) {
    throw "repo isn't set";
  }
  return process.env.GITHUB_REPOSITORY;
}

interface SearchRespPRs {
  search: SearchResultPRs
}

interface SearchResultPRs {
  nodes: Array<SearchResultNode>
}

interface SearchResultNode {
  number: number
  title: string
  url: string
  headRefName: string
}

function formatDate(date: Date): string {
  return `${date.toISOString().slice(0, -5)}+00:00`;
}

export const run = async (): Promise<void> => {
  const ghToken = core.getInput('github_token');
  const octokit = github.getOctokit(ghToken);
  const author = core.getInput('renovate_login');
  const skipLabels = core.getInput('skip_labels');
  const additionalQuery = core.getInput('additional_query');
  const createdBeforeMinutes = core.getInput('created_before_minutes');
  const createdTime = new Date();
  createdTime.setTime(createdTime.getTime() - parseInt(createdBeforeMinutes) * 60 * 1000)
  const created = formatDate(createdTime);
  const repo = getRepo();
  core.info('Getting pull requests');
  let query = `type: ISSUE, last: 100, query: "is:open is:pr author:${author} repo:${repo} created:<=${created}`;
  if (additionalQuery) {
    query = `${query} ${additionalQuery}"`;
  } else {
    query = `${query}"`;
  }
  core.info(query);
  const result: SearchRespPRs = await octokit.graphql(`
query {
  search(${query}) {
    issueCount
    nodes {
      ... on PullRequest {
        number
        title
        url
        headRefName
      }
    }
  }
}`, {});

  core.info(`The number of pull requests: ${result.search.nodes.length}`);
  for (let i = 0; i < result.search.nodes.length; i++) {
    const node = result.search.nodes[i];
    core.info(`Close a pull request: title=${node.title} number=${node.number} url=${node.url}`);
    await octokit.rest.pulls.update({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      pull_number: node.number,
      state: 'closed',
    });
    core.info(`Delete a ref: title=${node.title} ref=${node.headRefName}`);
    await octokit.rest.git.deleteRef({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      ref: node.headRefName,
    }).catch(e => {
      core.info(`Failed to delete a ref: title=${node.title} ref=${node.headRefName}: ${e}`);
    });
  }
}
