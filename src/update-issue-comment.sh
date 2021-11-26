#!/bin/bash

set -euo pipefail

echo "| Result | Step |" > result.md
echo "|---|---|" >> result.md

if [ $HAS_GITHUB_FOLDER == false  ]; then
    echo "| ⛔️ | No .github folder found |" >> result.md    
fi

if [ $HAS_WORKFLOWS_FOLDER == false ]; then
    echo "| ⛔️ | No Workflows found  |" >> result.md
fi

if [ $HAS_DEPENDABOT_CONFIGURATION ]; then
    echo "| ✅ | Dependabot configuration found |" >> result.md
else
    echo "| ⛔️ | No Dependabot configuration found |" >> result.md
fi

if [ $HAS_CODEQL_INIT ]; then
    echo "| ✅ | CodeQL Init found in $WORKFLOW_WITH_CODEQL_INIT |" >> result.md
else
    echo "| ⛔️ | No CodeQL Init found |" >> result.md
fi

if [ $HAS_CODEQL_ANALYZE ]; then
    echo "| ✅ | CodeQL Analyze found in $WORKFLOW_WITH_CODEQL_ANALYZE |" >> result.md
else
    echo "| ⛔️ | No CodeQL Analyze found |" >> result.md
fi

echo "|---|---|" >> result.md

if [ $ACTION_USES_DOCKER ]; then
    echo "| ℹ️ | Uses Docker container |" >> result.md

    if [ $HAS_LOW_MEDIUM_ISSUES ]; then
        echo "| ⚠️ | $LOW_MEDIUM_ISSUES Low or medium issues found |" >> result.md
    else
        echo "| ✅ | No Low or Medium issues found |" >> result.md
    fi

    if [ $HAS_HIGH_CRITICAL_ISSUES ]; then
        echo "| ⛔️ | $HIGH_CRITICAL_ISSUES High or critical issues found |" >> result.md
    else
        echo "| ✅ | No High or Critical issues found |" >> result.md
    fi
fi

cat result.md

