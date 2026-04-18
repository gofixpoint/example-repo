/**
 * End-to-end Linear-driven coding agent workflow on top of the Amika CLI.
 *
 * Trigger: a Linear ticket tagged with the `agent-fix` label. Pickup fires
 * only when the ticket is in a Todo state (`unstarted` type). Tickets in
 * other states (including "In Review") are ignored for now.
 *
 * Flow:
 *   1. Poll Linear for tickets labeled `agent-fix` whose state type is
 *      `unstarted` (Todo). The `waitForAgentTicket()` function is the seam —
 *      swap it for a real webhook handler (Linear signs payloads with
 *      SHA-256) without touching the rest of the pipeline.
 *
 *   2. If the picked-up ticket still carries a stale `agent-done` label
 *      from a prior run, strip it so the re-run starts clean.
 * 
 *   3. Create a git branch off the current branch, named after the ticket.
 *
 *   4. Spin up an Amika sandbox mounted at that branch, exposing the
 *      backend (3001) and frontend (3000) dev servers.
 *
 *   5. Send the ticket body to Claude via `amika sandbox agent-send` so the
 *      ticket plan is executed and the backend/frontend servers come up.
 *
 *   6. Ask the agent to open a PR for review. No GH PR monitoring follows.
 * 
 *   7. Post a Linear comment with the PR URL (parsed from the agent's
 *      reply), remove the `agent-fix` label, add the `agent-done` label,
 *      and move the ticket to the "In Review" workflow state so a human
 *      can review. The sandbox is then deleted and the loop returns to
 *      step 1.
 *
 * Run:
 *   This script must be run from the root of this repository — the repo the
 *   agent will modify and open PRs against. `amika sandbox create --git`
 *   mounts the current working directory into the sandbox, so `cwd` must be
 *   the repo root.
 *
 *     cd /path/to/example-repo
 *     pnpm dlx tsx examples/linear-auto-implementer.ts
 *
 * Environment:
 *   LINEAR_API_KEY                required for polling (personal API key)
 *   LINEAR_POLL_INTERVAL_MS       poll cadence (default 10000)
 *   LINEAR_AGENT_FIX_LABEL        pickup label (default "agent-fix")
 *   LINEAR_AGENT_DONE_LABEL       handoff label (default "agent-done")
 *   LINEAR_REVIEW_STATE_NAME      state name that re-triggers pickup
 *                                 (default "In Review")
 *   AMIKA_SANDBOX_IMAGE           override the sandbox image
 *   AMIKA_SANDBOX_PRESET          coder | coder-dind (default coder)
 *   AMIKA_REPO_PATH               override the repo path (default: cwd)
 */

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const LINEAR_API_KEY = process.env.LINEAR_API_KEY ?? "";
const LINEAR_POLL_INTERVAL_MS = Number(
  process.env.LINEAR_POLL_INTERVAL_MS ?? 10_000,
);
const LABEL_AGENT_FIX = process.env.LINEAR_AGENT_FIX_LABEL ?? "agent-fix";
const LABEL_AGENT_DONE = process.env.LINEAR_AGENT_DONE_LABEL ?? "agent-done";
// First-time pickup state types. Linear state types:
// triage, backlog, unstarted, started, completed, canceled.
// We intentionally exclude `backlog` — only Todo (`unstarted`) fires pickup.
const PICKUP_STATE_TYPES = ["unstarted"];
// Re-pickup state name — matches tickets the agent previously moved to
// "In Review"; re-applying `agent-fix` triggers another pass on them.
const REVIEW_STATE_NAME =
  process.env.LINEAR_REVIEW_STATE_NAME ?? "In Review";
const REPO_PATH = process.env.AMIKA_REPO_PATH ?? process.cwd();
const SANDBOX_PRESET = process.env.AMIKA_SANDBOX_PRESET ?? "coder";
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

// -----------------------------------------------------------------------------
// Ticket shape (only the fields we read)
// -----------------------------------------------------------------------------

interface LabelNode {
  id: string;
  name: string;
}

interface AgentTicket {
  id: string;
  identifier: string; // e.g. "ENG-1234"
  title: string;
  description?: string | null;
  branchName?: string | null;
  url?: string;
  labels?: { nodes?: LabelNode[] };
}

// -----------------------------------------------------------------------------
// Amika CLI helpers
// -----------------------------------------------------------------------------

function runAmika(args: string[], opts: { input?: string } = {}): string {
  const result = spawnSync("amika", args, {
    input: opts.input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    throw new Error(`amika ${args.join(" ")} exited with ${result.status}`);
  }
  return result.stdout ?? "";
}

// -----------------------------------------------------------------------------
// Sandbox lifecycle
// -----------------------------------------------------------------------------

/**
 * amika sandbox create \
 *   --name <sandboxName> \
 *   --preset <SANDBOX_PRESET> \
 *   --git=<REPO_PATH> \
 *   --new-branch <sandboxName> \
 *   --port <BACKEND_PORT>:<BACKEND_PORT> \
 *   --port <FRONTEND_PORT>:<FRONTEND_PORT> \
 *   --yes
 */
function createSandbox(sandboxName: string): void {
  console.log(`[amika] creating sandbox ${sandboxName}:`);
  runAmika([
    "sandbox",
    "create",
    "--name",
    sandboxName,
    "--preset",
    SANDBOX_PRESET,
    // `--git` takes an optional value — must use `=` form, otherwise pflag
    // treats the path as a positional and errors with "unknown command".
    `--git=${REPO_PATH}`,
    "--new-branch",
    sandboxName,
    "--port",
    `${BACKEND_PORT}:${BACKEND_PORT}`,
    "--port",
    `${FRONTEND_PORT}:${FRONTEND_PORT}`,
    "--yes",
  ]);
}

/**
 * echo "<prompt>" | amika sandbox agent-send <sandboxName> --agent claude
 */
function agentSend(sandboxName: string, prompt: string): string {
  console.log(`\n[agent-send → ${sandboxName}]\n${prompt}\n`);
  const out = runAmika(
    ["sandbox", "agent-send", sandboxName, "--agent", "claude"],
    { input: prompt },
  );
  if (out) console.log(out);
  return out;
}

// Grab the first GitHub PR URL the agent printed. `gh pr create` echoes the
// URL on its own line, and the `--reply-with-url` ask in PR_PROMPT encourages
// the agent to surface it too, so a regex match is reliable enough for a demo.
function extractPrUrl(output: string): string | null {
  const match = output.match(/https:\/\/github\.com\/[^\s"']+\/pull\/\d+/);
  return match ? match[0] : null;
}

/**
 * amika sandbox delete <sandboxName> --force
 */
function deleteSandbox(sandboxName: string): void {
  console.log(`[amika] deleting sandbox ${sandboxName}`);
  spawnSync("amika", ["sandbox", "delete", sandboxName, "--force"], {
    stdio: "inherit",
  });
}

// -----------------------------------------------------------------------------
// Ticket → sandbox prompts
// -----------------------------------------------------------------------------

function buildCodePrompt(issue: AgentTicket): string {
  const description = issue.description?.trim() ?? "(no description)";
  return [
    `Linear ticket: ${issue.identifier} — ${issue.title}`,
    issue.url ? `URL: ${issue.url}` : "",
    ``,
    `## Plan from ticket`,
    description,
    ``,
    `Execute this plan on the current branch. Before finishing:`,
    `- start the backend dev server on port ${BACKEND_PORT}`,
    `- start the frontend dev server on port ${FRONTEND_PORT}`,
    `- verify the feature end-to-end, then commit.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const PR_PROMPT = [
  `Push the branch and open a PR using \`gh pr create\`.`,
  `Title: use the Linear ticket title.`,
  `Body: summarize the changes, link the Linear ticket, list manual test steps.`,
  `Reply with the PR URL once opened.`,
].join("\n");

// -----------------------------------------------------------------------------
// Linear GraphQL
// -----------------------------------------------------------------------------

async function linearGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Linear HTTP ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (body.errors) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(body.errors)}`);
  }
  return body.data as T;
}

const labelIdCache = new Map<string, string>();

async function getLabelId(name: string): Promise<string> {
  const cached = labelIdCache.get(name);
  if (cached) return cached;
  const data = await linearGraphQL<{
    issueLabels: { nodes: { id: string }[] };
  }>(
    `query LabelId($name: String!) {
      issueLabels(filter: { name: { eq: $name } }, first: 1) {
        nodes { id }
      }
    }`,
    { name },
  );
  const id = data.issueLabels?.nodes?.[0]?.id;
  if (!id) throw new Error(`Linear label "${name}" not found`);
  labelIdCache.set(name, id);
  return id;
}

async function addLabel(issueId: string, labelName: string): Promise<void> {
  const labelId = await getLabelId(labelName);
  console.log(`[linear] +label "${labelName}" on ${issueId}`);
  await linearGraphQL(
    `mutation AddLabel($id: String!, $labelId: String!) {
      issueAddLabel(id: $id, labelId: $labelId) { success }
    }`,
    { id: issueId, labelId },
  );
}

async function removeLabel(issueId: string, labelName: string): Promise<void> {
  const labelId = await getLabelId(labelName);
  console.log(`[linear] -label "${labelName}" on ${issueId}`);
  await linearGraphQL(
    `mutation RemoveLabel($id: String!, $labelId: String!) {
      issueRemoveLabel(id: $id, labelId: $labelId) { success }
    }`,
    { id: issueId, labelId },
  );
}

// Resolve a workflow state ID for the team that owns this issue.
async function getStateId(
  issueId: string,
  stateName: string,
): Promise<string> {
  const data = await linearGraphQL<{
    issue: {
      team: { states: { nodes: { id: string }[] } };
    };
  }>(
    `query StateId($issueId: String!, $stateName: String!) {
      issue(id: $issueId) {
        team {
          states(filter: { name: { eq: $stateName } }, first: 1) {
            nodes { id }
          }
        }
      }
    }`,
    { issueId, stateName },
  );
  const stateId = data.issue?.team?.states?.nodes?.[0]?.id;
  if (!stateId) {
    throw new Error(
      `Workflow state "${stateName}" not found on team for issue ${issueId}`,
    );
  }
  return stateId;
}

async function moveToState(
  issueId: string,
  stateName: string,
): Promise<void> {
  const stateId = await getStateId(issueId, stateName);
  console.log(`[linear] state → "${stateName}" on ${issueId}`);
  await linearGraphQL(
    `mutation MoveState($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) { success }
    }`,
    { id: issueId, stateId },
  );
}

async function addComment(issueId: string, body: string): Promise<void> {
  console.log(`[linear] +comment on ${issueId}: ${body.split("\n")[0]}`);
  await linearGraphQL(
    `mutation AddComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) { success }
    }`,
    { issueId, body },
  );
}

// -----------------------------------------------------------------------------
// Ticket source
//
// `waitForAgentTicket()` is the seam. Today it busy-waits on Linear's GraphQL
// API; swap it for a webhook-backed implementation (e.g. push each verified
// payload onto an in-memory queue and `await queue.shift()`) without touching
// the orchestration below.
// -----------------------------------------------------------------------------

const seenTicketIds = new Set<string>();

async function waitForAgentTicket(): Promise<AgentTicket> {
  if (!LINEAR_API_KEY) {
    throw new Error("LINEAR_API_KEY is required for polling mode");
  }
  console.log(
    `[linear] polling every ${LINEAR_POLL_INTERVAL_MS}ms for tickets labeled ` +
      `"${LABEL_AGENT_FIX}" in states [${PICKUP_STATE_TYPES.join(", ")}]`,
  );
  while (true) {
    const ticket = await pollLinearOnce();
    if (ticket && !seenTicketIds.has(ticket.id)) {
      seenTicketIds.add(ticket.id);
      return ticket;
    }
    await sleep(LINEAR_POLL_INTERVAL_MS);
  }
}

async function pollLinearOnce(): Promise<AgentTicket | null> {
  const data = await linearGraphQL<{
    issues: { nodes: AgentTicket[] };
  }>(
    `query AgentTickets($label: String!, $stateTypes: [String!]!) {
      issues(
        first: 5,
        filter: {
          labels: { name: { eq: $label } },
          state: { type: { in: $stateTypes } }
        },
        orderBy: createdAt
      ) {
        nodes {
          id identifier title description branchName url
          labels { nodes { id name } }
        }
      }
    }`,
    { label: LABEL_AGENT_FIX, stateTypes: PICKUP_STATE_TYPES },
  ).catch((err: unknown) => {
    console.error(`[linear] poll failed:`, err);
    return null;
  });
  if (!data) return null;
  return data.issues?.nodes?.find((t) => !seenTicketIds.has(t.id)) ?? null;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  ensureAmikaAuth();

  while (true) {
    // 1. A Linear ticket labeled `agent-fix` in a backlog/todo state is the
    //    trigger. `waitForAgentTicket()` busy-waits today; replace it with a
    //    webhook-backed queue to go push-based.
    const ticket = await waitForAgentTicket();
    console.log(`[linear-agent] picked up ${ticket.identifier} — ${ticket.title}`);

    // 2. Strip a stale `agent-done` label from a previous run (if any) so
    //    re-processing starts clean.
    const hasAgentDone = ticket.labels?.nodes?.some(
      (l) => l.name === LABEL_AGENT_DONE,
    );
    if (hasAgentDone) {
      await removeLabel(ticket.id, LABEL_AGENT_DONE);
    }

    // Suffix with a compact timestamp so repeated runs against the same
    // ticket don't collide on the remote sandbox name (409 conflict).
    const runSuffix = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14); // YYYYMMDDHHMMSS
    // No `/` in the name — downstream routes embed it in the URL path.
    const sandboxName = `linear-agent-${ticket.identifier.toLowerCase()}-${runSuffix}`;
    try {
      // 3. Create a branch off the current branch, named after the ticket.
      //    Done inside the sandbox via `--new-branch` so the host repo state
      //    is never mutated.
      // 4. Spin up the Amika sandbox mounted at that branch.
      createSandbox(sandboxName);

      try {
        // 5. Hand the ticket plan to the agent. The same prompt asks the
        //    agent to start the backend/frontend servers so the change is
        //    exercised end-to-end.
        agentSend(sandboxName, buildCodePrompt(ticket));

        // 6. Ask the agent to open a PR. We don't monitor the PR from here,
        //    but we do parse the URL out of its reply so we can post a
        //    Linear comment linking the ticket to the PR.
        const prOutput = agentSend(sandboxName, PR_PROMPT);
        const prUrl = extractPrUrl(prOutput);
        if (prUrl) {
          await addComment(
            ticket.id,
            `Agent opened a PR for review: ${prUrl}`,
          );
        } else {
          console.warn(
            `[linear-agent] could not extract PR URL from agent output — skipping Linear comment`,
          );
        }

        // 7. Hand off: remove `agent-fix`, add `agent-done`, move the
        //    ticket into "In Review" so a human can take a look.
        await removeLabel(ticket.id, LABEL_AGENT_FIX);
        await addLabel(ticket.id, LABEL_AGENT_DONE);
        await moveToState(ticket.id, REVIEW_STATE_NAME);
      } finally {
        deleteSandbox(sandboxName);
      }
    } catch (err) {
      console.error(`[linear-agent] ticket ${ticket.identifier} failed:`, err);
    }
  }
}

/**
 * amika auth status
 */
function ensureAmikaAuth(): void {
  const status = spawnSync("amika", ["auth", "status"], { encoding: "utf8" });
  if (status.status !== 0) {
    throw new Error(
      `amika auth status failed — run \`amika auth login\` (or set AMIKA_API_KEY) before starting this demo`,
    );
  }
}

main().catch((err) => {
  console.error("[linear-agent] fatal:", err);
  process.exit(1);
});
