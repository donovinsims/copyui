import { Row, DemoLabel } from "./Specimen";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Meter } from "../components/ui/Meter";
import { AIAnswer } from "../components/ui/AIAnswer";
import { ApprovalCard } from "../components/ui/ApprovalCard";
import { AgentInbox, type AgentTask } from "../components/ui/AgentInbox";
import { ChatComposer } from "../components/ui/ChatComposer";
import { ModelPicker, type ModelOption } from "../components/ui/ModelPicker";
import { ThinkingLoader } from "../components/ui/ThinkingLoader";
import { ToolCallCard } from "../components/ui/ToolCallCard";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "../lib/icons";

export function PatternsPage({ onComponents }: { onComponents: () => void }) {
  return (
    <>
      <section className="page-hero">
        <span className="page-eyebrow">
          <span className="page-eyebrow-dot" />
          Patterns · composed
        </span>
        <h1 className="page-title">
          The system, <em>in use</em>.
        </h1>
        <p className="page-lead">
          A pattern is not a new component. It is the existing pieces arranged so the work is
          legible: what is running, what it touched, what needs a person, and what it cost.
        </p>
        <Row gap={6}>
          <Button size="sm" variant="secondary" iconRight={<ArrowRightIcon size={13} />} onClick={onComponents}>
            See the pieces
          </Button>
        </Row>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Agent run · review before send</h2>
            <p className="doc-section__lead">
              Two columns: the conversation and its evidence on the left, the operational state on
              the right. Every number is tabular, every surface is one of two elevations.
            </p>
          </div>
        </div>
        <div className="pattern-shell">
          <div className="pattern-chat">
            <div className="pattern-chat__head">
              <Avatar name="Orchestrator" size={24} status="online" />
              <span className="pattern-chat__title">Orchestrator</span>
              <span className="pattern-chat__meta">4 sources · $0.42 · 50s</span>
            </div>

            <div className="pattern-scroll">
              <div className="pattern-user">Check the October launch, then send the update to EU customers.</div>

              <div className="pattern-agent">
                <Avatar name="Orchestrator" size={22} />
                <div className="pattern-agent__body">
                  <span className="pattern-agent__name">Orchestrator</span>
                  <ThinkingLoader size="sm" phases={["Planning", "Reading the changelog", "Drafting"]} interval={2400} done />
                  <ToolCallCard
                    name="web.search"
                    status="done"
                    summary="changelog + launch notes"
                    durationMs={3200}
                    args={{ query: "October launch notes", limit: 4 }}
                    result={'{\n  "sources": 4,\n  "top": "notion.so/launch-october"\n}'}
                  />
                  <ToolCallCard
                    name="gmail.draft"
                    status="done"
                    summary="newsletter · 42 recipients"
                    durationMs={2100}
                    args={{ audience: "customers-eu", template: "october" }}
                  />

                  <AIAnswer
                    answer={`The draft is ready and matches the launch notes [1]. It leads with the **three biggest changes** and keeps the CTA to one line.\n\n- Opens with the release date\n- One screenshot per feature\n- Plain-text fallback included [2]`}
                    sources={[
                      { name: "Notion", title: "Launch notes · October", snippet: "Three features ship on the 14th." },
                      { name: "Gmail", title: "Newsletter template v4", snippet: "Plain-text fallback is generated automatically." },
                    ]}
                    animate={false}
                  />
                </div>
              </div>

              <ApprovalCard
                title="Send campaign email"
                description="October product update · Newsletter"
                risk="medium"
                label="Step 4 · gmail.send"
                details={[
                  { label: "To", value: "Customers — EU (42)" },
                  { label: "Subject", value: "What's new in October" },
                  { label: "Send", value: "Today, 9:00 AM" },
                ]}
                expiresIn={90}
                onApprove={() => new Promise<void>((resolve) => window.setTimeout(resolve, 700))}
                onDeny={() => undefined}
              />
            </div>

            <ChatComposer
              placeholder="Ask for a change before it sends…"
              loadMs={700}
              defaultFolder="Marketing"
            />
          </div>

          <aside className="pattern-side">
            <DemoLabel>State</DemoLabel>
            <div className="side-stack">
              <div className="side-row">
                <span>Run</span>
                <Badge tone="accent" dot pulse>running</Badge>
              </div>
              <div className="side-row">
                <span>Approval</span>
                <Badge tone="warn" dot>1 waiting</Badge>
              </div>
              <div className="side-row">
                <span>Cost</span>
                <span className="side-value">$0.42</span>
              </div>
              <div className="side-row">
                <span>Steps</span>
                <span className="side-value">4 of 6</span>
              </div>
            </div>

            <Meter value={0.66} label="Context" detail="132k / 200k" tone="accent" />
            <Meter value={0.42} label="Run budget" detail="$0.42 / $1.00" tone="warn" />

            <div className="doc-divider" />
            <DemoLabel>Model</DemoLabel>
            <ModelPicker models={RUN_MODELS} />

            <div className="doc-divider" />
            <DemoLabel>Live inbox</DemoLabel>
            <AgentInbox tasks={RUN_TASKS} footer="2 running · 1 needs you" />
          </aside>
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Approval, three intensities</h2>
            <p className="doc-section__lead">
              Risk is a tone and a sentence, never a red button. The destructive action is still a
              quiet pill until the person has read the consequence.
            </p>
          </div>
        </div>
        <div className="doc-grid doc-grid--3">
          <ApprovalCard
            title="Read the CRM export"
            description="Read-only, 1,204 rows"
            risk="low"
            allowAlways
            details={[{ label: "Scope", value: "Contacts · read only" }]}
            approveLabel="Allow"
            shortcuts={false}
            onDeny={() => undefined}
          />
          <ApprovalCard
            title="Post to the team channel"
            description="7 people will be notified"
            risk="medium"
            details={[{ label: "Channel", value: "#product" }]}
            approveLabel="Post"
            shortcuts={false}
            onDeny={() => undefined}
          />
          <ApprovalCard
            title="Rotate production keys"
            description="All services restart once"
            risk="high"
            icon={<ShieldIcon size={15} />}
            allowAlways={false}
            details={[{ label: "Services", value: "12" }]}
            approveLabel="Rotate keys"
            shortcuts={false}
            onDeny={() => undefined}
          />
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Composition rules</h2>
            <p className="doc-section__lead">Memorise these five and new screens stay on-system.</p>
          </div>
        </div>
        <div className="doc-grid doc-grid--2">
          <Rule
            index="01"
            title="One primary action per surface"
            text="Everything else is secondary or ghost. Two solid buttons side by side is always a design error."
          />
          <Rule
            index="02"
            title="State lives in badges and dots"
            text="Waiting, running, failed and done are tonal badges with a 5px dot — not coloured rows."
          />
          <Rule
            index="03"
            title="Numbers are tabular"
            text="Clocks, costs and counters use font-variant-numeric: tabular-nums so live updates never jitter."
          />
          <Rule
            index="04"
            title="Two elevations, maximum"
            text="Page, card. Popovers are the only third level, and only while open."
          />
          <Rule
            index="05"
            title="Motion follows state"
            text="If nothing is happening, nothing moves. Loops are reserved for live work."
          />
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Copy the system</h2>
            <p className="doc-section__lead">
              The components are plain React with their CSS in the file. Drop tokens.css and the
              component you need into any React 19 project.
            </p>
          </div>
        </div>
        <div className="copy-grid">
          <CardCopy title="1 · tokens.css" text="Two layers of variables, light and dark, elevation modes, reduced motion." />
          <CardCopy title="2 · a component" text="One TSX file with its styles injected once. No Tailwind, no animation library." />
          <CardCopy title="3 · your accent" text="Override --accent and --accent-2. Everything else follows." />
        </div>
        <div className="found-note">
          <strong>Licensing note:</strong> this is an independent implementation of a visible design
          language. The original library's source is proprietary — do not copy its files. Use these
          tokens and components for your own product, and keep the original's licence in mind if you
          redistribute a lookalike.
        </div>
      </section>
    </>
  );
}

const RUN_MODELS: ModelOption[] = [
  { id: "auto", name: "Auto", description: "Picks per task", speed: 0.8, quality: 0.82, cost: 0.5, firstTokenMs: 380 },
  { id: "sonnet", name: "Sonnet 5.5", description: "Balanced, long context", speed: 0.68, quality: 0.9, cost: 0.62, firstTokenMs: 520, tag: "default" },
  { id: "sol", name: "GPT-6 Sol", description: "Fast tools", speed: 0.94, quality: 0.74, cost: 0.28, firstTokenMs: 240 },
];

const RUN_TASKS: AgentTask[] = [
  {
    id: "p1",
    title: "Send campaign to EU customers",
    agent: "Ops agent",
    status: "waiting",
    elapsedMs: 42_000,
    cost: 0.42,
    steps: ["Build the audience", "Render the template", "Wait for approval"],
    currentStep: 2,
  },
  {
    id: "p2",
    title: "Draft the October newsletter",
    agent: "Writer agent",
    status: "running",
    elapsedMs: 128_000,
    cost: 0.18,
    steps: ["Collect the changelog", "Pick three highlights", "Write the draft"],
    currentStep: 2,
  },
  {
    id: "p3",
    title: "Summarise competitor pricing",
    agent: "Research agent",
    status: "done",
    elapsedMs: 55_000,
    cost: 0.11,
    steps: ["Find pricing pages", "Extract tiers", "Compare"],
  },
];

function Rule({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="dna" style={{ flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
      <span className="dna__index">{index}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="dna__title">{title}</span>
        <span className="dna__text">{text}</span>
      </span>
    </div>
  );
}

function CardCopy({ title, text }: { title: string; text: string }) {
  return (
    <div className="dna">
      <span className="dna__icon"><CheckIcon size={13} /></span>
      <span className="dna__title">{title}</span>
      <span className="dna__text">{text}</span>
    </div>
  );
}
