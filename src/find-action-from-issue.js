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
      break
    }
  }

  let commentBody
  let result
  if (action == null) {
    console.log('Action to use not found')
    commentBody = [
      `:robot: Could not find action from the request in the issue body :danger:`,
      ``,
      `Please make sure you have this on a line in the body:`,
      `uses: organization/repo`
    ]
    
    result = 1
  }
  else {
    console.log('Action to use found')
    commentBody = [
      `:robot: Found action from the request in the issue body ✅`,
      ```${action}```,
      `This action will now be checked automatically and the results will be posted back in this issue.`
    ]
    
    result = 0
  }

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

  // create comment letting the user know the results
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body: commentBody.join('\n')
  });
  
  return 0
}