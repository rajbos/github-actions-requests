const { secureHeapUsed } = require("crypto")

module.exports = async ({github, owner, repo, issue_number, codeql_run_link, codeqlResult, securityScanResult, fs}) => {

    console.log(``)
    console.log(`Looking at this repository: [${owner}/${repo}] with issue number [${issue_number}]`)
    console.log(`CodeQL scan results:`)
    console.log(`- url: ${codeqlResult.url}`)
    console.log(`- results.count: [${codeqlResult.results_count}]`)
    console.log(`- environment: [${codeqlResult.environment}]`)
    console.log(`- created_at: [${codeqlResult.created_at}]`)
    console.log(`- securityScanResults: [${securityScanResult}]`)
    
    let codeQLSymbol = ''
    if (codeqlResult.results_count === 0) {
        codeQLSymbol = ':white_check_mark:'
    }
    else {
        codeQLSymbol = ':x:'
    }

    let commentBody = [
        `:robot: Found these results:`,
        ``,
        `|Check|Results|Links|`,
        `|---|---|---|`,
        `|CodeQL on the forked repo|${codeQLSymbol}|[CodeQL run](${codeql_run_link})|`,
        ``
    ]   

    // load the securityScanResult file    
    const scanResult = fs.readFileSync(securityScanResult);
    console.log(`scanResult: [${scanResult}]`)
    let securityBody = [
        ``,
        `Security scan: `,
        `${scanResult}`
    ]

    commentBody.push.apply(commentBody, securityBody)

    // create comment letting the user know the results
    const result = await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody.join('\n')
    });
    //console.log(`Issue created result: [${JSON.stringify(result)}]`)
}  
