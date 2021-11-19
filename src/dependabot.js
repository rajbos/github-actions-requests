module.exports = async ({github, owner, repo}) => {
    console.log(`Looking at this repository: [${owner}/${repo}]`)

    // todo: handle pagination if needed
    const { repository } = await github.graphql(`
      query ($name:String!, $owner:String!){
        repository(name: $name, owner: $owner) {
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
        name: repo,
    });
      

    console.log(`Repository result: ${JSON.stringify(repository)}`)      
    console.log(`-----------------------------------------------`)      
    console.log(`Repository result: ${repository}`)
}