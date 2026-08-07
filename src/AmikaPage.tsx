import {
  AutomationIcon,
  ChatIcon,
  GitIcon,
  ModelIcon,
  NetworkIcon,
  RecordIcon,
  SandboxIcon,
  ShieldCheckIcon,
  SnapshotIcon,
  TeamIcon,
  TerminalIcon
} from './icons'
import { Link } from './router'

const useCases = [
  {
    label: 'Engineering',
    title: 'Devboxes',
    icon: <TerminalIcon size={26} />,
    copy: 'Cloud devboxes reachable over SSH and VPN, preloaded with your stack and restored from snapshots instead of provisioned from scratch.'
  },
  {
    label: 'Team',
    title: 'Cloud background agents',
    icon: <TeamIcon size={26} />,
    copy: 'Interactive agents anyone can drive from Slack, Linear, or the web — several people can watch and steer the same session.'
  },
  {
    label: 'Automation',
    title: 'APIs and workflows',
    icon: <AutomationIcon size={26} />,
    copy: 'Programmatic background agents that run on their own, kicked off by an event or an API call rather than by a person at a keyboard.'
  }
]

const capabilities = [
  {
    icon: <GitIcon />,
    title: 'Defined as code',
    copy: 'Sandbox configuration lives in a git repo, so an environment is reviewable and reproducible.'
  },
  {
    icon: <SnapshotIcon />,
    title: 'Snapshot boots',
    copy: 'Machines resume from a prepared snapshot, so a fresh sandbox is seconds of waiting, not minutes.'
  },
  {
    icon: <NetworkIcon />,
    title: 'Run anywhere, isolated',
    copy: 'Hosted cloud, your own laptop, or your Kubernetes cluster — isolated from your primary machine by default.'
  },
  {
    icon: <ModelIcon />,
    title: 'Any agent, any model',
    copy: 'Bring the agent and model you already use. Nothing about the sandbox locks you into one vendor.'
  },
  {
    icon: <ShieldCheckIcon />,
    title: 'Work that verifies itself',
    copy: 'With a real machine an agent can run the build and the tests, so guardrails check the output instead of trusting it.'
  },
  {
    icon: <RecordIcon />,
    title: 'Recorded sessions',
    copy: 'Full transcripts and costs for every run, so you can audit what an agent did and what it spent.'
  }
]

export default function AmikaPage() {
  return (
    <div className="page-shell">
      <div className="mesh-bg" aria-hidden="true" />

      <header className="hero">
        <p className="eyebrow">What is Amika?</p>
        <h1>The control plane for sandboxed cloud agents.</h1>
        <p className="hero-copy">
          Amika gives an agent a real computer to work on — created on demand, isolated from yours, and shaped like the
          environment your team actually develops in.
        </p>
        <div className="hero-actions">
          <Link to="/" className="button-link">
            Back to the demo
          </Link>
          <a className="button-link ghost" href="https://www.amika.dev/" target="_blank" rel="noreferrer">
            amika.dev
          </a>
        </div>
      </header>

      <section className="explainer" aria-label="What Amika is">
        <div className="explainer-icon" aria-hidden="true">
          <SandboxIcon size={30} />
        </div>
        <div className="explainer-copy">
          <p>
            The unit of work is a <strong>sandbox</strong>: a VM you can create on Amika&apos;s cloud, on a machine you
            already own, or in your own Kubernetes cluster. You describe what belongs on it — your repos, your
            toolchain, your services — and then run whatever agent and model you prefer inside it. Because the agent has
            a whole machine rather than a narrow set of tool calls, it can install a dependency, start a server, and run
            the test suite. That is also what makes its output checkable: an agent that can run your build can prove the
            change works instead of asserting that it does.
          </p>
          <p>
            Sandbox configuration lives in a git repo, so environments are reviewed like any other code and rebuilt the
            same way every time, booting from snapshots rather than being provisioned from scratch. Once a sandbox is
            running it is reachable the way a normal machine is — SSH and VPN for people, APIs and event triggers for
            automation — and its agents take messages from Slack, Linear, or the web, so a teammate can redirect a run
            without opening a terminal. Every session is recorded with its transcript and cost, which is what turns a
            pile of background agents into something you can actually operate.
          </p>
        </div>
      </section>

      <section className="use-cases" aria-label="What teams use it for">
        {useCases.map((useCase) => (
          <article key={useCase.title}>
            <div className="icon-badge" aria-hidden="true">
              {useCase.icon}
            </div>
            <p className="use-case-label">{useCase.label}</p>
            <h2>{useCase.title}</h2>
            <p>{useCase.copy}</p>
          </article>
        ))}
      </section>

      <section className="capabilities" aria-label="Platform capabilities">
        <h3>What you get</h3>
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title}>
              <div className="capability-head">
                <span className="icon-badge small" aria-hidden="true">
                  {capability.icon}
                </span>
                <h4>{capability.title}</h4>
              </div>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture" aria-label="How a sandbox comes together">
        <h3>From repo to running agent</h3>
        <div className="flow">
          <div>Config in Git</div>
          <div>Sandbox VM</div>
          <div>Agent + Model</div>
          <div>Verified Work</div>
        </div>
        <p className="flow-note">
          <ChatIcon size={18} /> Reachable from Slack, Linear, the web, SSH, or the API at every step.
        </p>
      </section>

      <footer className="page-footnote">
        <p>
          Summarized from <a href="https://www.amika.dev/">amika.dev</a>. This site is a mocked demo — nothing on this
          page provisions a real sandbox.
        </p>
      </footer>
    </div>
  )
}
