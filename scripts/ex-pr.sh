#!/bin/bash

amika sandbox create --git --secret env:ANTHROPIC_API_KEY --name testing-claude-api

CLAUDE_SETTINGS='
{
    "permissions": {
        "allow": [
            "Bash(git:*)",
            "Bash(gh:*)"
        ]
    }
}'

CLAUDE_GITIGNORE="settings.local.json"

amika sandbox ssh testing-claude-api << EOF 2>/dev/null
mkdir -p \$AMIKA_AGENT_CWD/.claude
echo '$CLAUDE_GITIGNORE' > \$AMIKA_AGENT_CWD/.claude/.gitignore
echo '$CLAUDE_SETTINGS' > \$AMIKA_AGENT_CWD/.claude/settings.local.json
exit
EOF



CLAUDE_UUID=$(uuidgen)

echo $CLAUDE_UUID

CLAUDE_PROMPT="Change the heading text to also include, 'Dylan was here!' You should make this change on a new git branch, and when you are done you should commit the branch and make a Github PR. Do this in one shot. Do not ask me any questions. Make sure to also git commit your changes and then make a PR. To reiterate, do these in order:

1. create a new git branch
2. make the code changes
3. commit your code changes
4. make a Github PR with the changes

Do not stop, do not ask me for clarification or questions.
"

amika sandbox ssh -t testing-claude-api << EOF 2>/dev/null
cd \$AMIKA_AGENT_CWD && claude --dangerously-skip-permissions --session-id '$CLAUDE_UUID' -p '$CLAUDE_PROMPT' < /dev/null
exit
EOF

# For some reason, Claude does not like single-shotting both the code changes and the git branch/commit/PR. So we need to do it in two steps.
amika sandbox ssh -t testing-claude-api << EOF 2>/dev/null
cd \$AMIKA_AGENT_CWD && claude --dangerously-skip-permissions --resume '$CLAUDE_UUID' -p 'Make a git branch and commit the changes. Then make a Github PR' < /dev/null
exit
EOF
