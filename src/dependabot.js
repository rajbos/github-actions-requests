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

    console.log(`Repository result: ${JSON.stringify(repository.vulnerabilityAlerts.nodes)}`)
    console.log(`-----------------------------------------------`)      
    console.log(`Count of the result: ${repository.vulnerabilityAlerts.nodes.length}`)
    const highAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'HIGH')
    const mediumAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'MEDIUM')

    console.log(`Found [${highAlerts.length}] advisory with severity 'HIGH'`)
    console.log(`Found [${mediumAlerts.length}] advisory with severity 'MEDIUM'`)
}