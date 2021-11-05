module.exports = async ({github, owner, repo}) => {

    console.log(`Looking at this repository: [${owner}/${repo}]`)

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
}