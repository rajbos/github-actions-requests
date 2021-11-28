module.exports = async ({github, owner, repo, languages}) => {

    async function addCodeQLworkflow(github, owner, repo) {
        
        const { readFileSync } = require('fs')
        const path = 'codeql-analysis.yml'
        const content = readFileSync(`${process.env.GITHUB_WORKSPACE}/${path}`)
        
        const targetPath = ".github/workflows/codeql-analysis.yml"                                    
        console.log(`Uploading the CodeQL workflow to the forked repository`)
        github.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: targetPath,
            message: "🤖 Adding CodeQL workflow file",
            content: content.toString('base64'),
            sha: undefined
        })

        // wait for the backend to process the new file, so that we don't trigger it to fast
        await wait(5000)
        console.log('CodeQL workflow uploaded')
        return targetPath
    }

    async function deleteExistingWorkflows(github, owner, repo) {   
        console.log(`Deleting existing workflows in the fork`) 
        // load default branch from repo
        const {data: repository} = await github.rest.repos.get({
            owner,
            repo
        })

        console.log(`Default_branch for repo [${repo}] is [${repository.default_branch}]`)
        
        const ref = repository.default_branch
        try {
          // https://docs.github.com/en/rest/reference/git#get-a-reference
          const {
            data: {
              object: {sha}
            }
          } = await github.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
            owner,
            repo,
            ref: `heads/${ref}`
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
        return ref
    }

    function wait(milliseconds) {
      return new Promise(_resolve => {
          if (typeof milliseconds !== 'number') {
          throw new Error('milliseconds not a number')
          }
          setTimeout(() => _resolve('done!'), milliseconds)
      })
    }

    function loadLanguagesToAnalyse(languages) {      
      // goal is to replace the line below with only the languages we get from Linguist:
      // language: [ 'cpp', 'csharp', 'go', 'java', 'javascript', 'python' ]
      console.log(`Languages inputs: [${JSON.stringify(languages)}]`)
      let languagesToAnalyse = []
      if (languages.C !== null) {
        languagesToAnalyse.push('cpp')
      }

      if (languages.Csharp !== null) {
        languagesToAnalyse.push('csharp')
      }
      
      if (languages.Go !== null) {
        languagesToAnalyse.push('go')
      }

      if (languages.Java !== null) {
        languagesToAnalyse.push('java')
      }

      if (languages.Python !== null) {
        languagesToAnalyse.push('python')
      }
      if (languages.JavaScript !== null) {
        languagesToAnalyse.push('javascript')
      }
      return languagesToAnalyse
    }

    console.log(`Looking at this repository: [${owner}/${repo}]`)
    const languagesToAnalyse = loadLanguagesToAnalyse(languages)
    console.log(`Languages to analyse: [${JSON.stringify(languagesToAnalyse)}]`)
    let languageString = 'language: ['
    for (const language of languagesToAnalyse) {
      languageString += `'${language}'', `
    }
    // cut off last comma:
    languageString = languageString.substring(0, languageString.length - 2) + ']'
    console.log(`Languages to analyse: [${languageString}]`)

    const ref = await deleteExistingWorkflows(github, owner, repo)
    const targetPath = await addCodeQLworkflow(github, owner, repo)

    return { ref, targetPath }
}