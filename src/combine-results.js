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
    console.log(`commentBody length: [${commentBody.length}]`)     
    

    // load the securityScanResult file
    console.log(`Loading securityScanResult file: [${securityScanResult}]`)
    console.log(`Running in this dir [${__dirname}]`)
    if (fs.existsSync(securityScanResult)) {
        console.log("The file exists");
    } else {
        console.log("The file does not exist");
    }

    fs.readFile(securityScanResult, function (err, data) {
        if (err) {
          throw err
        }
        console.log('file info:')
        console.log(data.toString())
            
        // commentBody.push(``)
        // commentBody.push(`Security scan: `)
        // commentBody.push(`${data}`)

        let securityBody = [
            ``,
            `Security scan: `,
            `${data}`
        ]

        commentBody.push.apply(securityBody)
        console.log(`commentBody length: [${commentBody.length}]`)
    });

    console.log(`commentBody length: [${commentBody.length}]`)
    commentBody.forEach(element => {
        console.log(`line: [${element}]`)
    });

    // create comment letting the user know the results
    const result = await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody.join('\n')
    });
    //console.log(`Issue created result: [${JSON.stringify(result)}]`)
}  
