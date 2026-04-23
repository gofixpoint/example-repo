# Commands

```
amika sandbox create \
    --name dylan/pylon-demo \
    --git=https://github.com/gofixpoint/example-repo/ \
    --branch main

amika sandbox ssh dylan/pylon-demo 'cd workspace && git clone https://github.com/gofixpoint/example-scratch.git'

amika sandbox agent-send dylan/pylon-demo $PROMPT
```

# Prompt

Implement this Linear issue: https://linear.app/fixpoint/issue/KAPRO-252/move-environment-variables-section

First, look at the /home/workspace/example-scratch and see if there are notes for another ticket requesting the same or similar changes. If there are, and those notes link to a Github PR, skip doing anything.

Otherwise, check out a new dylan/pylon-demo branch in the example-repo. Make your code changes, commit them, then push as a Github PR and watch CI to make sure it finishes. When it finishes, mark the Linear issue with label "agent-done".

Now, we want to add this is a note to the example-scratch repo. In that repo, check out a branch with the same dylan/pylon-demo name. If linear/notes.jsonl does not exist, create it. Then, add to the bottom of it a JSON line with the following fields:

- `linear_ticket_url`
- `github_pr_url`
- `linear_text`: text from the Linear issue
- `change_summary`: text summary of your changes


Commit this, push it as a new PR, and then squash-merge that PR into main.
