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
    
    console.log(`Found ofa total of [${repository.vulnerabilityAlerts.nodes.length}] vulnerability alerts (contains duplicates)`)
    const highAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'HIGH').distinct('securityVulnerability.package.name')
    const moderateAlerts = repository.vulnerabilityAlerts.nodes.filter(alert => alert.securityVulnerability.advisory.severity === 'MODERATE').distinct('securityVulnerability.package.name')

    console.log(`Found [${highAlerts.length}] advisory with severity 'HIGH'`)
    console.log(`Found [${moderateAlerts.length}] advisory with severity 'MODERATE'`)

    return {high: highAlerts.length,  moderate: moderateAlerts.length}
}