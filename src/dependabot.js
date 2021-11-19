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
    
    console.log(`Count of the result: ${repository.vulnerabilityAlerts.nodes.length}`)
    // todo: run a distinct query on top of it. In the example repo we have 15 results while we only have 11  in the UI
    const highAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'HIGH')
    const moderateAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'MODERATE')

    console.log(`Found [${highAlerts.length}] advisory with severity 'HIGH'`)
    console.log(`Found [${moderateAlerts.length}] advisory with severity 'MODERATE'`)

    return {high: highAlerts.length,  moderate: moderateAlerts.length}
}