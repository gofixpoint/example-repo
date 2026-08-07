import { Link } from './router'
import {
  AgentIcon,
  GitConfigIcon,
  NetworkIcon,
  ReplayIcon,
  SandboxIcon,
  SnapshotIcon,
  SurfacesIcon,
  VerifyIcon
} from './icons'

const useCases = [
  {
    id: '01',
    icon: <SandboxIcon />,
    title: 'Engineering: devboxes',
    copy: 'Cloud devboxes with SSH and VPN access, preloaded with your stack and restored from fast snapshots.'
  },
  {
    id: '02',
    icon: <AgentIcon />,
    title: 'Team: cloud background agents',
    copy: 'Interactive agents anyone can drive from Slack, Linear, GitHub, or the web — multiplayer, with no setup.'
  },
  {
    id: '03',
    icon: <SurfacesIcon />,
    title: 'Automation: APIs and workflows',
    copy: 'Programmatic background agents and event-driven workflows as code that run on their own and verify their output.'
  }
]

const capabilities = [
  {
    icon: <GitConfigIcon />,
    title: 'Defined as code',
    copy: 'Each sandbox boots from a git repo whose config declares the base image, services, seeded data, and which agents run where.'
  },
  {
    icon: <SnapshotIcon />,
    title: 'Boots from snapshots',
    copy: 'Full VM state is snapshotted — installed tools, running services, warm caches — so nothing rebuilds from scratch.'
  },
  {
    icon: <NetworkIcon />,
    title: 'Reachable like a host',
    copy: 'SSH in, join a VPN, or expose a service URL. Every sandbox behaves like any other machine on your network.'
  },
  {
    icon: <VerifyIcon />,
    title: 'Verified and guarded',
    copy: 'Agents check their own work against your guardrails, and humans stay in the loop wherever you want a gate.'
  },
  {
    icon: <AgentIcon />,
    title: 'Any agent, any model',
    copy: 'Run Codex, Claude Code, or OpenCode. The harness and model are yours to swap; the environment stays the same.'
  },
  {
    icon: <ReplayIcon />,
    title: 'Every session recorded',
    copy: 'Replay what an agent did, step by step, and hand the session to a teammate to pick up or audit.'
  }
]

const flow = ['Git-defined config', 'Amika control plane', 'Sandbox VM + agent', 'Slack / Linear / CLI / API']

export default function AmikaPage() {
  return (
    <div className="page-shell">
      <div className="mesh-bg" aria-hidden="true" />

      <header className="hero">
        <p className="eyebrow">About Amika • The control plane for sandboxed cloud agents</p>
        <h1>Give your agents the best environment to automate their work.</h1>
        <p className="hero-copy">
          Amika gives AI agents a real computer to work on. You create a sandbox VM — on Amika&apos;s hosted cloud, on
          infrastructure you own, or on the desktop in your closet — and run any agent inside it. Because the sandbox is
          a full, isolated machine rather than a stripped-down shell, agents get the same stack, services, and network
          access your engineers do: SSH, VPN, and exposed service URLs included.
        </p>
        <p className="hero-copy">
          Sandboxes and agents are defined as code in a git repo, so an environment is reproducible instead of
          hand-assembled, and boots in seconds from a VM snapshot that keeps installed tools, running services, and warm
          caches intact. From there you message your agents and trigger workflows from whatever surface you already use —
          Slack, Linear, GitHub, the CLI, the API, or the web — and every session is recorded so you can replay it or
          hand it to a teammate. It is the same sandbox and agent underneath whether you use it as a devbox, as a
          background teammate, or as pure automation, so you can move between them without starting over.
        </p>
        <div className="hero-actions">
          <Link className="button-link" to="/">
            Back to the demo
          </Link>
          <a className="button-link ghost" href="https://www.amika.dev/" target="_blank" rel="noreferrer">
            Visit amika.dev
          </a>
        </div>
      </header>

      <section className="use-cases" aria-label="Ways to use Amika">
        {useCases.map((useCase) => (
          <article key={useCase.id}>
            <div className="icon-badge">{useCase.icon}</div>
            <p className="step-number">{useCase.id}</p>
            <h2>{useCase.title}</h2>
            <p>{useCase.copy}</p>
          </article>
        ))}
      </section>

      <section className="capabilities" aria-label="How Amika works">
        <h3>What makes it work</h3>
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title}>
              <div className="icon-badge small">{capability.icon}</div>
              <div>
                <h4>{capability.title}</h4>
                <p>{capability.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture" aria-label="How a sandbox comes together">
        <h3>From repo to running agent</h3>
        <div className="flow">
          {flow.map((step) => (
            <div key={step}>{step}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
