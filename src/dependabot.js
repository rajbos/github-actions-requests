module.exports = async ({github, owner, repo}) => {
    console.log(`Looking at this repository: [${owner}/${repo}]`)

    const {
        result ,
      } = await github.graphql(`{
        repository($owner: String!, $repo: String!") {
            vulnerabilityAlerts(first: 100) {
                nodes {
                    createdAt
                    dismissedAt
                    securityVulnerability {
                        package {
                            name
                        }
                        advisory {
                            description
                            severity
                        }
                    }
                }
            }
        }
    }`,
    {
        owner,
        repo,
    });
      

    console.log(`Repository result: ${result}`)      

}