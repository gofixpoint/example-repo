#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <sandbox-name> <linear-issue-url>" >&2
  exit 1
fi

SANDBOX_NAME="$1"
LINEAR_ISSUE_URL="$2"

errcho() { echo "$@" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT=$(sed "s|{{LINEAR_ISSUE_URL}}|${LINEAR_ISSUE_URL}|g" "$SCRIPT_DIR/prompt-template.md")

errcho "Creating sandbox '$SANDBOX_NAME'..."
amika sandbox create \
    --name "$SANDBOX_NAME" \
    --git=https://github.com/gofixpoint/example-repo/ \
    --branch main

errcho "Cloning example-scratch into sandbox..."
amika sandbox ssh "$SANDBOX_NAME" \
    'cd workspace && git clone https://github.com/gofixpoint/example-scratch.git' || true

errcho "Sending prompt to agent..."
amika sandbox agent-send "$SANDBOX_NAME" "$PROMPT"

errcho "Done."
