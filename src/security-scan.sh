#!/bin/bash

set -euo pipefail

function github_folder_checks() {
    echo "Checking for files in the .github folder"
    if [ ! -d "action/.github" ] ; then
        echo ::set-output name=has_github_folder::false
        echo ::set-output name=has_workflows_folder::false
        echo ::set-output name=has_dependabot_configuration::false
        echo ::set-output name=has_codeql_init::false
        echo ::set-output name=has_codeql_analyze::false        

        exit 0
    fi

    echo ::set-output name=has_github_folder::true

    if [[ -n $(find action/.github -maxdepth 1 -name dependabot.yml) ]] ; then 
        echo ::set-output name=has_dependabot_configuration::true
    else 
        echo ::set-output name=has_dependabot_configuration::false
    fi

    if [ ! -d "action/.github/workflows" ]; then
        echo ::set-output name=has_workflows_folder::false
        echo ::set-output name=has_codeql_init::false
        echo ::set-output name=has_codeql_analyze::false

        exit 0
    fi

    echo ::set-output name=has_workflows_folder::true

    # Look for CodeQL init workflow
    if [ `grep action/.github/workflows/*.yml -e 'uses: github/codeql-action/init' | wc -l` -gt 0 ]; then
        WORKFLOW_INIT=`grep action/.github/workflows/*.yml -e 'uses: github/codeql-action/init' -H | cut -f1 -d' ' | sed "s/:$//g"`
        echo ::set-output name=workflow_with_codeql_init::${WORKFLOW_INIT}
        echo ::set-output name=has_codeql_init::true
    else
        echo ::set-output name=has_codeql_init::false
    fi

    # Look for CodeQL analyze workflow
    if [ `grep action/.github/workflows/*.yml -e 'uses: github/codeql-action/analyze' | wc -l` -gt 0 ]; then
        WORKFLOW_ANALYZE=`grep action/.github/workflows/*.yml -e 'uses: github/codeql-action/analyze' -H | cut -f1 -d' ' | sed "s/:$//g"`
        echo ::set-output name=workflow_with_codeql_analyze::${WORKFLOW_ANALYZE}
        echo ::set-output name=has_codeql_analyze::true
    else
        echo ::set-output name=has_codeql_analyze::false
    fi
}

function action_docker_checks() {
    echo "Checking for docker configuration"
    if [ "docker" != `yq e '.runs.using' action/action.yml` ] ; then
        echo ::set-output name=action_uses_docker::false
        exit 0
    fi

    echo ::set-output name=action_uses_docker::true

    echo "Installing trivy"
    sudo apt-get install wget apt-transport-https gnupg lsb-release
    wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
    echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
    sudo apt-get update
    sudo apt-get install trivy

    if [ "Dockerfile" == `yq e '.runs.image' action/action.yml` ]; then
        echo "Scan docker image with trivy"
        docker build -t action-checkout/$ACTION action/
        trivy --quiet image action-checkout/$ACTION > issues
        docker image rm action-checkout/$ACTION
        else
        IMAGE=`yq e '.runs.image' action/action.yml`
        if  [[ $IMAGE = docker://* ]] ; then
            IMAGE=${IMAGE#docker://}
        fi 
        echo "Scan docker image with trivy [$IMAGE]"
        trivy --quiet image $IMAGE > issues
    fi

    echo "Trivy results file        --------------------------------------------------------------------------------------------------------"
    cat issues
    echo "End of Trivy results file --------------------------------------------------------------------------------------------------------"

    echo "Checking for trivy issues count:"
    # Check if LOW or MEDIUM issues are found (remove count from header)
    LOW_MEDIUM_ISSUES=$(cat issues | grep -e LOW -e MEDIUM | wc -l)
    echo " - $LOW_MEDIUM_ISSUES low and medium issues found"

    if [ $LOW_MEDIUM_ISSUES -gt 0 ] ; then
        echo ::set-output name=low_medium_issues::$LOW_MEDIUM_ISSUES
        echo ::set-output name=has_low_medium_issues::true
    else
        echo ::set-output name=has_low_medium_issues::false
    fi 

    # Check if HIGH or CRITICAL issues are found (remove count from header)
    HIGH_CRITICAL_ISSUES=$(cat issues | grep -e HIGH -e CRITICAL | wc -l)
    echo " - $HIGH_CRITICAL_ISSUES high and crititcal issues found"
    
    if [ $HIGH_CRITICAL_ISSUES -gt 0 ] ; then
        echo ::set-output name=high_critical_issues::$HIGH_CRITICAL_ISSUES
        echo ::set-output name=has_high_critical_issues::true
    else
        echo ::set-output name=has_high_critical_issues::false
    fi
}

action_docker_checks
github_folder_checks
