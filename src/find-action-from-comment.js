module.exports = async ({github, owner, repo, issue_number, core}) => {

  console.log(`Looking at this repository: [${owner}/${repo}]`)
  console.log(`Running with issue number [${issue_number}]`)

  if (issue_number == null) {
    core.setFailed('Issue_number not found')
    return
  }

  const issue = await github.rest.issues.get({
    owner: owner,
    repo: repo,
    issue_number: issue_number,
  })
  console.log(`Issue body: [${JSON.stringify(issue.data.body)}]`)

  let split = issue.data.body.split(/\r\n/)
  let action
  for (let i = 0; i < split.length; i++) {
    console.log(`Line [${i}] [${split[i]}]`)
    if (split[i].startsWith('uses: ')) {
      console.log(`Found uses statement!`)
        
      action = split[i].substring(6)
      let spaceIndex = action.indexOf(' ')
      if (spaceIndex > 0) {
        console.log(`found space at char [${spaceIndex}], cutting of the action text before it`)
        action = action.substring(0, spaceIndex)
      }
      console.log(`Found action with name [${action}]`)
    }
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
    console.log(`Using last comment's data, found [${comments.data.length}] comments on the issue.`)
    lastItem = comments.data[comments.data.length-1]
  } else {
    // use issue body
    // todo
    core.setFailed(`Can't find issue comment, we should use issue body. This is not supported yet.`)
    return
  }

  const body = lastItem.body
  if (!body) {
    console.log(`Can't load issue body`)

    let commentBody = [
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
      body: commentBody.join('\n')
    });

    core.setFailed(`Can't find action text in the last comment`)
    return
  }

  console.log(`Body we are analyzing: [${body}]`)
  let action2
  if (!body.startsWith('uses: ')) {              
    console.log(`No action found in the last comment: [${body}]`)

    let commentBody = [
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
      body: commentBody.join('\n')
    });

    core.setFailed(`Can't find action text in the last comment`)
    return
  } 

  action2 = body.substring(6)
  let spaceIndex = action2.indexOf(' ')
  if (spaceIndex > 0) {
    console.log(`found space at char [${spaceIndex}], cutting of the action text before it`)
    action2 = action2.substring(0, spaceIndex)
  }
  console.log(`Found action with name [${action2}]`)

  // return action
  let index = action2.indexOf('/')
  let actionOwner = action2.substring(0, index)
  let actionName = action2.substring(index+1)

  console.log(`Found owner:${actionOwner}`)
  console.log(`Found action:${actionName}`)

  console.log(`::set-output name=action::${action}`)
  console.log(`::set-output name=owner::${actionOwner}`)
  console.log(`::set-output name=name::${actionName}`)

  console.log(`::set-output name=request_owner::${owner}`)            
  console.log(`::set-output name=request_repo::${repo}`)
  console.log(`::set-output name=request_issue::${issue_number}`)

  return 0
}