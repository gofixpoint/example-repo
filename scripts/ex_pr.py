#!/usr/bin/env python3
"""Example script that creates a sandbox, configures Claude, and makes a PR."""

import os
import subprocess
import sys
import uuid

AMIKA = 'amika'


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a command, exiting on failure."""
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        print(f"Command failed: {' '.join(cmd)}", file=sys.stderr)
        sys.exit(result.returncode)
    return result


def ssh(sandbox: str, script: str, *, check: bool = True, tty: bool = False) -> subprocess.CompletedProcess:
    """Run a script in the sandbox via ssh."""
    cmd = [AMIKA, "sandbox", "ssh"]
    if tty:
        cmd.append("-t")
    cmd.append(sandbox)
    if not script.endswith("\n"):
        script += "\n"
    result = subprocess.run(cmd, input=script, text=True, stderr=subprocess.DEVNULL)
    if check and result.returncode != 0:
        print(f"SSH command failed (exit {result.returncode})", file=sys.stderr)
        sys.exit(result.returncode)
    return result


SANDBOX_NAME = "testing-claude-api"

CLAUDE_SETTINGS = """{
    "permissions": {
        "allow": [
            "Bash(git:*)",
            "Bash(gh:*)"
        ]
    }
}"""

CLAUDE_GITIGNORE = "settings.local.json"

CLAUDE_PROMPT = (
    "Change the heading text to also include, 'Dylan was here!'\n\n"
    "Do not stop, do not ask me for clarification or questions."
)


def main():
    print("Creating sandbox...", file=sys.stderr)
    run([
        AMIKA, "sandbox", "create",
        "--git",
        "--secret", "env:ANTHROPIC_API_KEY",
        "--name", SANDBOX_NAME,
    ])

    print("Configuring Claude settings in sandbox...", file=sys.stderr)
    settings_escaped = CLAUDE_SETTINGS.replace("'", "'\\''")
    ssh(SANDBOX_NAME, "\n".join([
        "mkdir -p $AMIKA_AGENT_CWD/.claude",
        f"echo '{CLAUDE_GITIGNORE}' > $AMIKA_AGENT_CWD/.claude/.gitignore",
        f"printf '%s\\n' '{settings_escaped}' > $AMIKA_AGENT_CWD/.claude/settings.local.json",
        "exit 0",
    ]), check=False)

    claude_uuid = str(uuid.uuid4())
    print(f"Generated Claude session ID: {claude_uuid}", file=sys.stderr)

    print("Running Claude to make code changes...", file=sys.stderr)
    ssh(SANDBOX_NAME, (
        f"cd $AMIKA_AGENT_CWD && "
        f"claude --dangerously-skip-permissions "
        f"--session-id '{claude_uuid}' "
        f"-p '{CLAUDE_PROMPT}' < /dev/null\n"
        f"exit 0"
    ), tty=True, check=False)

    # Claude does not like single-shotting both the code changes and the
    # git branch/commit/PR, so we do it in two steps.
    print("Resuming Claude to create git branch and PR...", file=sys.stderr)
    ssh(SANDBOX_NAME, (
        f"cd $AMIKA_AGENT_CWD && "
        f"claude --dangerously-skip-permissions "
        f"--resume '{claude_uuid}' "
        f"-p 'Make a git branch and commit the changes. Then make a Github PR' < /dev/null\n"
        f"exit 0"
    ), tty=True, check=False)

    print("Done.", file=sys.stderr)


if __name__ == "__main__":
    main()
