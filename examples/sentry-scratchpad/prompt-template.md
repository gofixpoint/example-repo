This is a Sentry issue: {{SENTRY_ISSUE_URL}}.

First, look at the /home/workspace/example-scratch/sentry/ directory and see if there are notes for another Sentry issue describing the same or similar error. If there are, and those notes link to a Github PR, skip doing anything.

Otherwise, read the issue, research our codebase, and try to come up with a hypothesis for why it is happening. Do root cause analysis to figure it out.

Then, create a new git branch like "amika/...". Fill in the "..." with something reasonable for the issue you are trying to fix.

Then, you will print your hypothesis to me. After that, you will try to make a test that reproduces the error. Commit this test as its own commit. Please be descriptive of what issue you are testing and how the test captures it. If you cannot come up with a test to reproduce the error, skip this step.

Then, you will fix the issue. If you implemented a test, you will use that test to evaluate if you fixed the issue. Otherwise, you will make a best-guess for whether you fixed it or not. When you are done, commit your change. Please be descriptive of how your commit fixes the root cause.

Then you will push your changes and make a new Github PR.

After pushing the Github PR, please monitor the CI and Github Actions for that PR to make sure it passes CI. If there are any errors, fix them.

Now, we want to add this as a note to the example-scratch repo. In that repo, check out a branch with the same name you used above. If sentry/notes.jsonl does not exist, create it. Then, add to the bottom of it a JSON line with the following fields:

- `sentry_issue_url`
- `github_pr_url`
- `hypothesis`: your root cause hypothesis
- `change_summary`: text summary of your changes

Commit this, push it as a new PR, and then squash-merge that PR into main.
