#!/bin/bash

# set -euo pipefail

errcho() { echo "$@" >&2; }

# Store your Anthropic API key in the vault.
amika secret claude push \
	--type api_key \
	--from-file /tmp/amikadev/secrets/CLAUDE_API_KEY

errcho "Creating sandbox..."
amika sandbox create --git \
	--agent-credential-type claude=api-key \
	--name testing-claude-api

export CLAUDE_SETTINGS='
{
    "permissions": {
        "allow": [
            "Bash(git:*)",
            "Bash(gh:*)"
        ]
    }
}'

export CLAUDE_GITIGNORE="settings.local.json"

errcho "Configuring Claude settings in sandbox..."
amika sandbox ssh testing-claude-api << EOF 2>/dev/null
mkdir -p \$AMIKA_AGENT_CWD/.claude
echo '$CLAUDE_GITIGNORE' > \$AMIKA_AGENT_CWD/.claude/.gitignore
echo '$CLAUDE_SETTINGS' > \$AMIKA_AGENT_CWD/.claude/settings.local.json
exit 0
EOF


export CLAUDE_UUID=$(uuidgen)

errcho "Generated Claude session ID: $CLAUDE_UUID"

export CLAUDE_PROMPT="Change the heading text to also include, 'Dylan was here!'

Do not stop, do not ask me for clarification or questions.
"

errcho "Running Claude to make code changes..."
amika sandbox ssh -t testing-claude-api << EOF 2>/dev/null
cd \$AMIKA_AGENT_CWD && claude --dangerously-skip-permissions --session-id '$CLAUDE_UUID' -p '$CLAUDE_PROMPT' < /dev/null
exit 0
EOF

# For some reason, Claude does not like single-shotting both the code changes and the git branch/commit/PR. So we need to do it in two steps.
errcho "Resuming Claude to create git branch and PR..."
amika sandbox ssh -t testing-claude-api << EOF 2>/dev/null
cd \$AMIKA_AGENT_CWD && claude --dangerously-skip-permissions --resume '$CLAUDE_UUID' -p 'Make a git branch and commit the changes. Then make a Github PR' < /dev/null
exit 0
EOF

errcho "Removing sandbox..."
amika sandbox rm --force testing-claude-api

errcho "Done."
