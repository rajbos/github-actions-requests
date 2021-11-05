module.exports = async ({github, owner, repo}) => {

    console.log(`Looking at this repository: [${owner}/${repo}]`)

    let data
    try {
        console.log(`before the call`)
        let { data } = await github.rest.actions.listWorkflowRunsForRepo({ 
            owner,
            repo
        })
        console.log(`after the call`)

        console.log(`data:`)
        console.log(data)
        
        console.log(`data.content:`)
        console.log(data.content)
    }
    catch (e) {
        // strange: seems like we are not getting here at all :-(
        console.log(`in the catch with e:`)
        console.log(e)
    }
    console.log(`after the catch`)

    if (data === undefined) {
        return 1
    }

    codeqlRuns = data.workflow_runs.filter(run => run.name === 'CodeQL')
    console.log(`codeqlRuns: ${JSON.stringify(codeqlRuns)}`)

    // get the most recent one, is always on top:
    codeQLRun = codeqlRuns[0]
    console.log(`codeQLRun info: id: [${codeQLRun.id}], status: : [${codeQLRun.status}], created_at: [${codeQLRun.created_at}], conclusion: : [${codeQLRun.conclusion}], workflow_id: [${codeqlRun.workflow_id}]`)

    // manually dispatch the workflow again, so that we can wait for it
    let { dispatchData } = await github.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: codeqlRun.workflow_id,
        ref: codeqlRun.head_branch,
    });

    console.log(`Start workflow result data: [${JSON.stringify(dispatchData)}]`)

}
