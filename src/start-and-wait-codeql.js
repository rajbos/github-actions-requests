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
            // trigger the worklfow
            // https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
            await github.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
                owner,
                repo,
                workflow_id: path,
                ref
            })

            // wait for the backend to handle the request completely, before we read the status
            await wait(5000)
            
            // load all the worfklow runs
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
            // find the run that was created the last
            for (const wfr of workflow_runs) {
                if (wfr.name === 'CodeQL' && getDateFromString(wfr.created_at) > lastRun) {
                    run_id = wfr.id
                    lastRun = getDateFromString(wfr.created_at)
                }
            }

            // wait for the scanner to finish
            if (run_id > 0) {                
                const scanResult = await waitForScan(github, owner, repo, run_id, lastRun)
                return {scanResult, run_id}
            }
            else {
                console.log('No CodeQL runs found')
                return {scanResult: 1, run_id}
            }
        } catch (error) {
            throw error
        }
    }

    async function waitForScan(github, owner, repo, run_id, lastRun) {
        // todo: display the link so users can follow along
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
          await wait(15000)
          return await waitForScan(github, owner, repo, run_id, lastRun)
        } 
        else {
          if (conclusion !== 'success' && conclusion !== null) {
            //throw new Error(`${name} concluded with status ${conclusion} (${html_url}).`)
            console.log(`Workflow [${name}] concluded with status [${conclusion}]: ${html_url}`)

            // load the jobs for the run and their results
            const {
                data
            } = await github.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
                owner,
                repo,
                run_id
            })

            // check each job
            let successfullJobs = 0
            console.log(`Job results:`)
            for (const job of data.jobs) {
                console.log(` - Job [${job.name}] status [${job.status}] conclusion [${job.conclusion}]`)
                if (job.status === 'completed' && job.conclusion === 'success') {
                    successfullJobs++
                }
            }

            if (successfullJobs === 0) {
                // post this information back into the request issue
            }

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
    console.log(`CodeQL workflow completion result: ${success.scanResult > 0}`)
    return success
}