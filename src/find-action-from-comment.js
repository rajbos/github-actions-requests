module.exports = async ({github, owner, repo, issue_number}) => {

  console.log(`Looking at this repository: [${owner}/${repo}]`)
  console.log(`running with issue number [${issue_number}]`)

  if (issue_number == null) {
    core.setFailed('issue_number not found')
    return
  }

  // load all comments for this issue
  // todo, figure out pagination:
  const comments = await github.rest.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: issue_number,
  })

  // find the last comment
  let lastItem            
  if (comments.data.length > 0) {
    // find latest
    console.log(`using last comment's data`)
    lastItem = comments.data[comments.data.length-1]
  } else {
    // use issue body
    // todo
    console.log(`Can't find issue comment, we should use issue body. This is not supported yet.`)
  }

  const body = lastItem.body
  if (!body) {
    console.log(`can't load issue body`)

    let body = [
      "Couldn't find the action uses statement in the last comment.",
      "Please create a comment that only has `uses: owner/action-name` in it.",
      "",
      ":robot:"
    ]
    
    // create comment letting the user now what to do
    github.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: body.join('\n')
    });

    core.setFailed(`Can't find action text in the last comment`)
    return
  }

  let action
  if (!body.startsWith('uses: ')) {              
    console.log('no action found')

    let body = [
      "Couldn't find the action uses statement in the last comment.",
      "Please create a comment that only has `uses: owner/action-name` in it.",
      "",
      ":robot:"
    ]
    
    // create comment letting the user know that we didn't find a comment
    github.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: body.join('\n')
    });

    core.setFailed(`Can't find action text in the last comment`)
    return
  } 

  action = body.substring(6)
  let spaceIndex = action.indexOf(' ')
  if (spaceIndex > 0) {
    console.log(`found space at char [${spaceIndex}], cutting of the action text before it`)
    action = action.substring(0, spaceIndex)
  }
  console.log(`Found action with name [${action}]`)
  console.log(action)

  // return action
  let index = action.indexOf('/')
  let actionOwner = action.substring(0, index)
  let actionName = action.substring(index+1)

  console.log(`Found owner:${actionOwner}`)
  console.log(`Found action:${actionName}`)

  console.log(`::set-output name=action::${action}`)
  console.log(`::set-output name=owner::${actionOwner}`)
  console.log(`::set-output name=name::${actionName}`)

  console.log(`::set-output name=request_owner::${owner}`)            
  console.log(`::set-output name=request_repo::${repo}`)
  console.log(`::set-output name=request_issue::${issue_number}`)
}