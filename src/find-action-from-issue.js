module.exports = async ({github, owner, repo, issue_number, core}) => {

  console.log(`Looking at this repository: [${owner}/${repo}]`)
  console.log(`Running with issue number [${issue_number}]`)

  // we always need these in the next steps:
  console.log(`::set-output name=request_owner::${owner}`)            
  console.log(`::set-output name=request_repo::${repo}`)
  console.log(`::set-output name=request_issue::${issue_number}`)

  if (issue_number == null || issue_number == undefined || issue_number == '') {
    core.setFailed('Issue_number not found')
    return
  }

  const issue = await github.rest.issues.get({
    owner: owner,
    repo: repo,
    issue_number: issue_number,
  })
  
  console.log(`Issue body: [${JSON.stringify(issue.data.body)}]`)

  let split
  if (issue.data.body.indexOf('\r\n') > -1) {
    split = issue.data.body.split(/\r\n/) // normal issue
  }
  else {
    split = issue.data.body.split(/\n\n/) // issue from template
  }

  let action
  console.log(`After splitting the body we have [${split.length}] lines`)
  for (let i = 0; i < split.length; i++) {
    console.log(`Line [${i}] [${split[i]}]`)
    if (split[i].startsWith('uses: ')) {
      console.log(`Found uses statement!`)
        
      action = split[i].substring(6)
      let spaceIndex = action.indexOf(' ')
      if (spaceIndex > 0) {
        console.log(`Found space at char [${spaceIndex}], cutting of the action text before it`)
        action = action.substring(0, spaceIndex)        
      }
      console.log(`Found action with name [${action}]`)
      break
    }
  }

  let result
  if (action === null || action === undefined || action === '') {
    console.log('Action to use not found')
    core.setFailed('Action to use not found')
    result = 1
  }
  else {
    console.log('Action to use found')
    result = 0
  }

  // return action
  if (result === 0) {
    let index = action.indexOf('/')
    let actionOwner = action.substring(0, index)
    let actionName = action.substring(index+1)

    console.log(`Found owner:${actionOwner}`)
    console.log(`Found action:${actionName}`)

    console.log(`::set-output name=action::${action}`)
    console.log(`::set-output name=owner::${actionOwner}`)
    console.log(`::set-output name=name::${actionName}`)
  }

  return { result, action }
}