module.exports = async ({github, owner, repo}) => {
    
    console.log(`Found owner [${owner}] and repo [${repo}] to check the code scanning alerts for`)

    const recentScansData = await github.rest.codeScanning.listRecentAnalyses({
        owner,
        repo,
    })

    if (recentScansData === undefined) {
        console.log(`recentScansData is undefined`)
    }
    else {
        // todo: check if this scan was recent enough (not older then x days)
        // todo: check if the scan had any errors and act on it
        const mostRecentScan = recentScansData.data[0]
        console.log(`Found most recent scan data that was created at [${mostRecentScan.created_at}] that can be found at [${mostRecentScan.url}]. The scan had [${mostRecentScan.results_count}] results and these errors: [${mostRecentScan.error}]. The scan ran with these environment values: [${JSON.stringify(mostRecentScan.environment)}]`)
    }

    // list all alerts, not just the most recent scan:
    const { data } = await github.rest.codeScanning.listAlertsForRepo({ 
        owner,
        repo
    })
    
    if (data === undefined) {
        console.log(`Alert response is undefined`)
    }
    else {
        if (data.length === 0) {
            console.log(`Overall check: No code scanning alerts found for the repo`)
        }
        else {
            console.log(`Overall check: Found [${data.length}] code scanning alerts for the repo`)
            // todo: check the severity of each alert / group by severity
            for (const alert of data) {
            console.log(`Alert [${alert.number}], created at: [${alert.created_at}], state: [${alert.state}], dismissed: [${alert.dismissed}], severity: [${(alert.rule.security_severity_level)}] with description: [${(alert.rule.description)}]`)
            }
        }
    }
}