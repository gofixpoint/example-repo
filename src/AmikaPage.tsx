import { AgentIcon, ChannelIcon, FlowDiagram, SandboxIcon, VerifyIcon } from './icons'

const pillars = [
  {
    Icon: SandboxIcon,
    title: 'Isolated by default',
    copy: 'Every agent gets its own sandbox VM, on Amika’s hosted cloud, your own infrastructure, or Kubernetes.'
  },
  {
    Icon: AgentIcon,
    title: 'Any agent, any model',
    copy: 'Claude Code, Codex, and OpenCode run on the same substrate, so there is no lock-in to one vendor.'
  },
  {
    Icon: ChannelIcon,
    title: 'Drive it from anywhere',
    copy: 'Start and steer sessions from Slack, Linear, GitHub, the web, or an API call — no local setup required.'
  },
  {
    Icon: VerifyIcon,
    title: 'Work that verifies itself',
    copy: 'Agents run your tests and custom checks inside the sandbox, and every session is recorded end to end.'
  }
]

const surfaces = [
  {
    label: 'engineering',
    title: 'Devboxes',
    copy: 'Cloud dev environments with SSH, VPN, and exposed service URLs, preloaded with your stack and resumed from a snapshot in seconds.'
  },
  {
    label: 'team',
    title: 'Cloud background agents',
    copy: 'Interactive agents anyone can start from the tools they already use, with teammates free to watch, redirect, or take over a live session.'
  },
  {
    label: 'automation',
    title: 'APIs + agentic workflows',
    copy: 'Programmatic agents and event-driven workflows as code, triggered by webhooks, schedules, or your own services.'
  }
]

export default function AmikaPage() {
  return (
    <>
      <header className="hero">
        <p className="eyebrow">About Amika • amika.dev</p>
        <h1>The control plane for sandboxed cloud agents.</h1>
        <p className="hero-copy">
          Amika creates isolated sandbox VMs and runs coding agents inside them. Sandboxes and agents are defined as code
          in your git repos, so an environment is reproducible: services, tooling, and seeded data come up on boot, boxes
          resume from VM snapshots in seconds, and the box you hand to an agent is the same one you would SSH into
          yourself. Because sandboxes get full network access — SSH, VPNs, exposed services — an agent can do real work
          there instead of guessing at it.
        </p>
        <p className="hero-copy">
          That one primitive covers three jobs. It is a devbox when a human wants a clean cloud environment, a background
          agent when a teammate kicks off work from Slack, Linear, or GitHub, and a workflow runner when a webhook or a
          schedule needs something done unattended. Along the way the platform supplies the parts that make in-house
          agents trustworthy: secrets stay hidden, network requests stay controlled, agents gate their own output on
          automated tests, and every session is recorded with transcripts and tool-call logs.
        </p>
      </header>

      <section className="amika-pillars" aria-label="What Amika provides">
        {pillars.map(({ Icon, title, copy }) => (
          <article key={title}>
            <span className="pillar-icon">
              <Icon />
            </span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="amika-flow" aria-label="How Amika fits together">
        <h3>How it fits together</h3>
        <FlowDiagram />
      </section>

      <section className="amika-surfaces" aria-label="Three ways to use Amika">
        <h3>Three ways to use it</h3>
        <dl>
          {surfaces.map(({ label, title, copy }) => (
            <div key={title}>
              <dt>
                <span className="surface-label">{label}</span>
                {title}
              </dt>
              <dd>{copy}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="amika-note">
        This page is part of a mocked demo site. The real product and docs live at{' '}
        <a href="https://www.amika.dev/">amika.dev</a>.
      </p>
    </>
  )
}
