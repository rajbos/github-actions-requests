module.exports = async ({github, owner, repo}) => {

    async function getLastRun(github, owner, repo) {
        let { data } = await github.rest.actions.listWorkflowRunsForRepo({ 
            owner,
            repo
        })

        if (data === undefined) {
            console.log(`data is undefined`)
            return 1
        }

        codeqlRuns = data.workflow_runs.filter(run => run.name === 'CodeQL')

        // get the most recent one, is always on top:
        codeQLRun = codeqlRuns[0]
        console.log(`codeQLRun info: id: [${codeQLRun.id}], status: [${codeQLRun.status}], created_at: [${codeQLRun.created_at}], conclusion: [${codeQLRun.conclusion}], workflow_id: [${codeQLRun.workflow_id}]`)
        return codeQLRun
    }
    
    console.log(`Looking at this repository: [${owner}/${repo}]`)
    lastRun = await getLastRun(github, owner, repo)
    console.log(`lastRun: ${lastRun}`)

    // manually dispatch the workflow again, so that we can wait for it
    let dispatchData = await github.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: lastRun.workflow_id,
        ref: lastRun.head_branch,
    });

    if (dispatchData.status !== 204) {	
        console.log(`Error starting the CodeQL workflow dispatch:`)
        console.log(`Start workflow result: [${JSON.stringify(dispatchData)}]`)
        return 1
    }

    // wait for the workflow to be started
    await wait(5000)

    // retrieve the last run (should be the new one)
    // todo: check if the newRun.id is not the same as oldrun.id
    // todo: handle longer starting of the run as well?
    lastRun = await getLastRun(github, owner, repo)
    console.log(`lastRun.id: ${lastRun.id}`)

    // wait for the workflow to finish
    await waitForScan(github, owner, repo, lastRun.id)
    
    async function waitForScan(github, owner, repo, run_id) {
        console.log(`Waiting for the CodeQL run to finish: [${run_id}]`)
        const data  = await github.rest.actions.getWorkflowRun({
            owner,
            repo,
            run_id
        })
        
        console.log(`CodeQL run information of run with id: [${run_id}], status: [${data.data.status}] and conclusion: [${data.data.conclusion}]`)
        if (data.data.status !== 'completed') {
            await wait(60000)
            await waitForScan(github, owner, repo, run_id)
        } else {
            // currently this fails in the test example: only one job is successful and the rest fails. We should do something with that :-)
            if (data.data.conclusion !== 'success' && data.data.conclusion !== null) {
            throw new Error(`${data.data.name} concluded with status ${data.data.conclusion} ${data.data.html_url}`)
            }
            else {
                console.log(`${data.data.name} concluded with status ${data.data.conclusion} ${data.data.html_url}`)
            }
        }
    }

    function wait(milliseconds) {
        return new Promise(_resolve => {
          if (typeof milliseconds !== 'number') {
            throw new Error('milliseconds not a number')
          }
          setTimeout(() => _resolve('done!'), milliseconds)
        })
    }
}
