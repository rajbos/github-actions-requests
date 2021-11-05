module.exports = async ({github, owner, repo}) => {

    console.log(`Looking at this repository: [${owner}/${repo}]`)

    console.log(`before the call`)
    let { data } = await github.rest.actions.listWorkflowRunsForRepo({ 
        owner,
        repo
    })

    console.log(`data:`)
    console.log(data)        

    if (data === undefined) {
        console.log(`data is undefined`)
        return 1
    }

    codeqlRuns = data.workflow_runs.filter(run => run.name === 'CodeQL')

    // get the most recent one, is always on top:
    codeQLRun = codeqlRuns[0]
    console.log(`codeQLRun info: id: [${codeQLRun.id}], status: [${codeQLRun.status}], created_at: [${codeQLRun.created_at}], conclusion: [${codeQLRun.conclusion}], workflow_id: [${codeQLRun.workflow_id}]`)

    // manually dispatch the workflow again, so that we can wait for it
    let dispatchData = await github.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: codeQLRun.workflow_id,
        ref: codeQLRun.head_branch,
    });

    console.log(`Start workflow result data: [${JSON.stringify(dispatchData)}]`)

}
