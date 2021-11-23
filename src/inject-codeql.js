module.exports = async ({github, owner, repo}) => {

    async function addCodeQLworkflow(github, owner, repo) {
        
        const { readFileSync } = require('fs')
        const path = 'codeql-analysis.yml'
        const content = readFileSync(`${process.env.GITHUB_WORKSPACE}/${path}`)
        
        const targetPath = ".github/workflows/codeql-analysis.yml"
        console.log(`Checking to see if [${targetPath}] already exists in the forked repo`)
        
        // this call gives a 404, since the file does not exist, how to handle this?
        let data
        try {
            console.log(`before the call`)
            let { data } = await github.rest.repos.getContent({ 
                owner,
                repo,
                path: ".github/workflows/codeql-analysis.yml"  // todo: use variable here
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
        
        let content2
        if (data === undefined || data.content === undefined) {
            console.log('data is null, so workflow does not exist yet')
            content2 = content
        } else {
            console.log('data is not null, so does exist? We need to compare their hashes to see if we need to overwrite')
            content2 = Buffer.from(data.content.toString('base64'), 'base64')
            if (Buffer.from(data.content, 'base64').compare(content2) === 0) {
            console.log('data in the codeql workflow file is the same. Halting execution')
            return
            }
        }
                    
        console.log(`Uploading the CodeQL workflow to the forked repository`)
        github.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: targetPath,
            message: "Adding CodeQL setup",
            content: content2.toString('base64'),
            sha: data === undefined ? undefined : data.sha
        })

        console.log('CodeQL workflow uploaded')

        // todo: find the CodeQL workflow execution and wait for it to complete
        // todo: handle the result of the workflow execution: what if all languages fail?
        // todo: read the results from the CodeQL workflow
        // todo: generate random cron schedule?
    }

    async function deleteExistingWorkflows(github, owner, repo) {   
        console.log(`Deleting existing workflows in the fork`) 
        // load default branch from repo
        const repository = await github.rest.repos.get({
            owner,
            repo
        })

        console.log(`Default_branch for repo [${repo}] is [${repository.default_branch}]`)
        
        try {
          // https://docs.github.com/en/rest/reference/git#get-a-reference
          const {
            data: {
              object: {sha}
            }
          } = await github.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
            owner,
            repo,
            ref: `heads/${repository.default_branch}`
          })
          // https://docs.github.com/en/graphql/reference/mutations#createcommitonbranch
          const {
            createCommitOnBranch: {
              commit: {oid}
            }
          } = await github.graphql(
            `mutation (
          $nwo: String!,
          $branch: String!,
          $oid: GitObjectID!
        ) {
          createCommitOnBranch(input: {
            branch: { repositoryNameWithOwner: $nwo, branchName: $branch },
            expectedHeadOid: $oid,
            message: { headline: "🤖 Delete existing workflows" },
            fileChanges: {
              deletions: [{ path: ".github/workflows" }]
            }
          }) {
            commit { url,  oid }
          }
        }`,
            {
              nwo: `${owner}/${repo}`,
              branch: ref,
              oid: sha
            }
          )
          this.oid = oid || sha
        } catch (error) {
          throw error
        }
      }

    console.log(`Looking at this repository: [${owner}/${repo}]`)
    await deleteExistingWorkflows(github, owner, repo)
    await addCodeQLworkflow(github, owner, repo)
}