module.exports = async ({github, owner, repo, path, ref}) => {
    async function triggerScans(github, owner, repo, path, ref) {

        if (path.indexOf('/') > 0) { 
            const paths = path.split('/')
            path = paths[paths.length - 1]            
        }
        console.log(`Working with workflow path [${path}] and ref [${ref}]`)

        try {
            // https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
            await github.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
                owner,
                repo,
                workflow_id: path,
                ref
            })
            // wait for the dispatch event to trigger
            await this.wait(5000)
            // https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
            const {
            data: {workflow_runs}
            } = await github.request('GET /repos/{owner}/{repo}/actions/runs', {
                owner,
                repo,
                event: 'workflow_dispatch'
            })
            let run_id = 0
            for (const wfr of workflow_runs) {
                if (wfr.name === 'CodeQL') run_id = wfr.id
            }
            // wait for the scanner to finish
            if (run_id > 0) {
              await this.waitForScan(github, owner, repo, run_id)
              return 0
            }
            else {
                console.log('No CodeQL runs found')
                return 1
            }
        } catch (error) {
            throw error
        }
    }

    async function waitForScan(github, owner, repo, run_id) {
        // https://docs.github.com/en/rest/reference/actions#get-a-workflow-run
        const {
          data: {name, status, conclusion, html_url}
        } = await github.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
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
        }
    }

    const success = await triggerScans(github, owner, repo, path, ref)
    return success
}