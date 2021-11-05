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

    // todo: check if result is a 204 (data is empty)
    console.log(`Start workflow result: [${JSON.stringify(dispatchData)}]`)
    console.log(`Start workflow result data: [${JSON.stringify(dispatchData.data)}]`)

    // wait for the workflow to be started
    await this.wait(5000)

    // retrieve the last run (should be the new one)
    // todo: check if the newRun.id is not the same as oldrun.id
    // todo: handle longer starting of the run as well?
    lastRun = await getLastRun(github, owner, repo)
    console.log(`lastRun: ${lastRun}`)

    // wait for the workflow to finish
    await waitForScan(github, owner, repo, lastRun.id)
    
    async function waitForScan(github, owner, repo, run_id) {
        const {
          data: {name, status, conclusion, html_url}
        } = await github.rest.actions.getWorkflowRun({
          owner,
          repo,
          run_id
        })

        if (status !== 'completed') {
          await this.wait(60000)
          await this.waitForScan(run_id)
        } else {
          if (conclusion !== 'success' && conclusion !== null) {
            throw new Error(`${name} concluded with status ${conclusion} (${html_url}).`)
          }
          else {
              console.log(`${name} concluded with status ${conclusion} (${html_url}).`)
          }
        }
      }
}
