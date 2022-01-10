# GitHub Actions Requests
This repository is meant to hold the setup for requesting actions to be used internally, for example together with the [Internal Actions Marketplace](https://devopsjournal.io/blog/2021/10/14/GitHub-Actions-Internal-Marketplace).

# Process description
1. User creates a new issue in this repo
1. The review team gets a notification about the new issue (using this action: [issue-comment-tag](https://github.com/devops-actions/issue-comment-tag))
1. After manual review, the review team labels the issue with `security-check`
1. The workflow `Issue labeled security scan` is triggered, executing several automated checks.
1. The results of all the checks are added back into the request issue.
1. After reviewing the results and approving them, the action repo can be forked into your actions organization and users can start using them.

# Video explanation
[![YouTube Link](./src/github-actions-request.png)](https://youtu.be/hYvFrlzeU8o)

# Checks
Currently we run the following checks:
- Has the repo been setup with a CodeQL workflow?
- Has the repo been configured with Dependabot updates? 
- If we fork the repo and enable Dependabot, do we get Security Alerts? 
- If we fork the repo and enable CodeQL, do we get Security Alerts?
- If the action uses a container, we run a [Trivy](https://github.com/aquasecurity/trivy) scan and check the alerts.

# Configuration
For configuration of the workflows in this repository, we use the following secrets:

|Name|Example value|Description|
|---|---|---|
|ACTIONS_STEP_DEBUG|true|Get additional debugging logs in Actions|
|GH_TOKEN|ghp_*****************|GitHub Token with enough access to fork the repos into a specific org|

# New issue setup
Whenever a new issue is added to this repo, the `new-issue.yml` workflow is triggered. For a description of what it does, check this [blogpost](https://blogs.blackmarble.co.uk/rfennell/2021/10/15/automating-adding-issues-to-beta-github-projects-using-github-actions/).

These are the secrets that it uses:
|Name|Example value|Description|
|---|---|---|
|PROJECT_ACCOUNT|rajbos|Account name under which the project is linked to|
|PROJECT_NUMBER|2|The number of the project|
|PROJECT_TOKEN|ghp_*****************|A token with access to add issues to the project|
