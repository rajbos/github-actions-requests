module.exports = async ({github, owner, repo, issue_number, codeqlResult}) => {

    console.log(``)
    console.log(`Looking at this repository: [${owner}/${repo}] with issue number [${issue_number}]`)
    console.log(`Running with this codeql result [${codeqlResult}]`)
    console.log(`Has object type: [${typeof codeqlResult}]`)
    console.log(`Has value: [${JSON.stringify(codeqlResult)}]`)

    const codeqlInfo = JSON.parse(codeqlResult.substring(1, codeqlResult.length - 1))
    console.log(`CodeQL scan results:`)
    console.log(`- url: ${codeqlInfo.url}`)
    console.log(`- results.count: [${codeqlInfo.results_count}]`)
    console.log(`- environment: [${codeqlInfo.environment}]`)
    console.log(`- created_at: [${codeqlInfo.created_at}]`)

    let codeQLSymbol = ''
    if (codeqlInfo.results_count === 0) {
        codeQLSymbol = ':white_check_mark:'
    }
    else {
        codeQLSymbol = ':x:'
    }

    let commentBody = [
        "Found these results:",
        "",
        "|Check|Results|",
        "|---|---|",
        '|CodeQL on the forked repo|${codeQLSymbol}|',
        "",
        ":robot:"
      ]
      
      // create comment letting the user know the results
      github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody.join('\n')
      });
}  