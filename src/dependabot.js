const { graphql } = require("@octokit/graphql");
// or: import { graphql } from "@octokit/graphql";

module.exports = async ({github, owner, repo, token}) => {
    console.log(`Looking at this repository: [${owner}/${repo}]`)

    const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${token}`,
        },
      });

      const { repository } = await graphqlWithAuth(`
        {
          repository(owner: "octokit", name: "graphql.js") {
            issues(last: 3) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `);

      console.log(`Repository result: ${repository}`)
      

}