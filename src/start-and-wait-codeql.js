module.exports = async ({github, owner, repo, path, ref}) => {

    function getDateFromString(dateString) {
        return new Date(dateString)
    }
    
    async function triggerScans(github, owner, repo, path, ref) {

        if (path.indexOf('/') > 0) { 
            const paths = path.split('/')
            path = paths[paths.length - 1]            
        }
        console.log(`Working with workflow path [${path}] and ref [${ref}]`)

        try {
            // https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
            const dispatchWorkflow = false // seems like adding the file to the repo as we currently do, already triggers the workflow. Now clue why!
            if (dispatchWorkflow) {
                await github.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
                    owner,
                    repo,
                    workflow_id: path,
                    ref
                })
                // wait for the dispatch event to trigger
                await wait(5000)
            }
            // https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
            const {
                data: {workflow_runs}
            } = await github.request('GET /repos/{owner}/{repo}/actions/runs', {
                    owner,
                    repo,
                    event: 'workflow_dispatch'
                })
            let run_id = 0
            let lastRun = new Date(0)
            for (const wfr of workflow_runs) {
                if (wfr.name === 'CodeQL' && getDateFromString(wfr.created_at) > lastRun) {
                    run_id = wfr.id
                    lastRun = getDateFromString(wfr.created_at)
                }
            }
            // wait for the scanner to finish
            if (run_id > 0) {                
                const scanResult = await waitForScan(github, owner, repo, run_id, lastRun)
                return scanResult
            }
            else {
                console.log('No CodeQL runs found')
                return 1
            }
        } catch (error) {
            throw error
        }
    }

    async function waitForScan(github, owner, repo, run_id, lastRun) {
        console.log(`Waiting for CodeQL run [${run_id}] that was created at [${lastRun}] to finish`)
        // https://docs.github.com/en/rest/reference/actions#get-a-workflow-run
        const {
          data: {name, status, conclusion, html_url}
        } = await github.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
          owner,
          repo,
          run_id
        })
        if (status !== 'completed') {
          await wait(60000)
          return await waitForScan(github, owner, repo, run_id, lastRun)
        } 
        else {
          if (conclusion !== 'success' && conclusion !== null) {
            //throw new Error(`${name} concluded with status ${conclusion} (${html_url}).`)
            console.log(`Workflow [${name}] concluded with status [${conclusion}]: ${html_url}`)
            return 1
          }

          // scan completed successfully
          console.log(`Workflow [${name}] completed successfully: ${html_url}`)
          return 0
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

    const success = await triggerScans(github, owner, repo, path, ref)
    console.log(`CodeQL workflow completion result: ${success > 0}`)
    return success
}