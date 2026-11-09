import { useState, type ReactNode } from "react";
import { Specimen, Row, Col, DemoLabel, Snippet } from "./Specimen";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardHeader, CardBody, CardFooter } from "../components/ui/Card";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Switch } from "../components/ui/Switch";
import { Field } from "../components/ui/Field";
import { Tooltip } from "../components/ui/Tooltip";
import { Avatar, AvatarStack } from "../components/ui/Avatar";
import { Meter, Ring } from "../components/ui/Meter";
import { ThinkingLoader } from "../components/ui/ThinkingLoader";
import { ChatComposer } from "../components/ui/ChatComposer";
import { MessageActions } from "../components/ui/MessageActions";
import { AIAnswer, type AnswerSource } from "../components/ui/AIAnswer";
import { ToolCallCard } from "../components/ui/ToolCallCard";
import { ApprovalCard } from "../components/ui/ApprovalCard";
import { ModelPicker, type ModelOption } from "../components/ui/ModelPicker";
import { AgentInbox, type AgentTask } from "../components/ui/AgentInbox";
import {
  ArrowUpIcon,
  BoltIcon,
  CopyIcon,
  FolderIcon,
  PaperclipIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  XIcon,
} from "../lib/icons";

type LibraryFilter = "all" | "chat" | "agent" | "inputs" | "surfaces";
type LibraryCategory = Exclude<LibraryFilter, "all">;

const LIBRARY_FILTERS: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "Components" },
  { id: "chat", label: "Chat" },
  { id: "agent", label: "Agent" },
  { id: "inputs", label: "Inputs" },
  { id: "surfaces", label: "Surfaces" },
];

const LIBRARY_CATEGORY: Record<LibraryCategory, string> = {
  chat: "Chat",
  agent: "Agent",
  inputs: "Inputs",
  surfaces: "Surfaces",
};

interface LibraryItem {
  slug: string;
  title: string;
  note: string;
  category: LibraryCategory;
  preview: ReactNode;
}

function LibraryCard({
  slug,
  title,
  note,
  category,
  children,
}: Omit<LibraryItem, "preview"> & { children: ReactNode }) {
  const isPro = category === "chat" || category === "agent";

  return (
    <article className={`library-card library-card--${slug}`}>
      <div className="library-card__stage" aria-hidden="true" inert>
        <div className="library-card__head">
          <span className="library-card__kind">{LIBRARY_CATEGORY[category]}</span>
          <span className="library-card__styles">2 styles</span>
          {isPro ? (
            <span className="library-card__badge is-pro">
              <BoltIcon size={10} /> Pro
            </span>
          ) : null}
        </div>
        <div className="library-card__preview">
          <div className={`library-card__preview-inner preview-${slug}`}>{children}</div>
        </div>
      </div>
      <div className="library-card__meta">
        <a className="library-card__info" href={`#spec-${slug}`}>
          <h3 className="library-card__title">{title}</h3>
          <p className="library-card__desc">{note}</p>
        </a>
        <span className="library-card__copy" aria-hidden="true">
          <CopyIcon size={14} />
        </span>
      </div>
    </article>
  );
}

function LibraryIndex() {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const items: LibraryItem[] = [
    {
      slug: "ai-answer",
      title: "AI Answer",
      note: "Streamed answer with source cards, citations and feedback.",
      category: "chat",
      preview: (
        <div className="lib-answer">
          <div className="lib-answer__q">Where should we hold the team offsite?</div>
          <div className="lib-answer__sources">
            <span className="lib-source"><b>N</b><span>Notion<i>Offsite plan — shortlist</i></span></span>
            <span className="lib-source"><b>S</b><span>Slack<i>#team-offsite — dates</i></span></span>
            <span className="lib-source"><b>L</b><span>Linear<i>OFF-142 · Book venue</i></span></span>
            <span className="lib-source lib-source--more"><b>+3</b><span>more</span></span>
          </div>
          <div className="lib-answer__label">
            <SparkleIcon size={9} /> Answer
          </div>
          <p className="lib-answer__p">
            <span className="lib-cite">1</span> Lisbon fits the €4,500 budget and <b>11 of 14</b> can make the second week of October.
          </p>
          <ul className="lib-answer__list">
            <li><span className="lib-cite">1</span> Venue: a converted studio near Príncipe Real, €1,900 for three nights.</li>
            <li><span className="lib-cite">3</span> Workshops: two half-days, leaving the afternoons free.</li>
            <li><span className="lib-cite">3</span> Risk: the deposit needs finance approval before 24 September.</li>
            <li><span className="lib-cite">1</span> Travel: direct flights from Berlin and Munich land before 10:30.</li>
            <li><span className="lib-cite">2</span> Food: two dinners at €28 per head, one hosted by the studio.</li>
          </ul>
          <p className="lib-answer__p lib-answer__p--muted">
            <span className="lib-cite">2</span> If the date slips a week, the venue drops to €1,650 — but two people can no longer join.
          </p>
          <div className="lib-answer__status"><span className="lib-live-dot" /> Writing</div>
          <div className="lib-answer__followups">
            <span>Draft the agenda</span>
            <span>Compare venues</span>
          </div>
        </div>
      ),
    },
    {
      slug: "chat-composer",
      title: "Chat Composer",
      note: "Prompt composer with model picker, voice input and approval.",
      category: "chat",
      preview: (
        <div className="lib-composer">
          <ChatComposer onSend={() => undefined} />
        </div>
      ),
    },
    {
      slug: "thinking-loader",
      title: "Thinking Loader",
      note: "Working pill with rolling phases and a settled done check.",
      category: "chat",
      preview: (
        <div className="lib-thinking">
          <ThinkingLoader size="sm" phases={["Thinking"]} interval={60000} />
          <div className="lib-thinking__row"><span className="lib-live-dot" /> Searched <b>7 sources</b></div>
          <div className="lib-thinking__row"><span className="lib-live-dot" /> Reading <b>3 pages</b></div>
          <div className="lib-thinking__line" />
          <div className="lib-thinking__row"><span className="lib-live-dot" /> Comparing dates</div>
        </div>
      ),
    },
    {
      slug: "message-actions",
      title: "Message Actions",
      note: "Copy, regenerate, feedback and read-aloud in one row.",
      category: "chat",
      preview: (
        <div className="lib-message">
          <div className="lib-message__bubble">The offsite budget is €4,500 for three nights.</div>
          <MessageActions text="The offsite budget is €4,500 for three nights." />
        </div>
      ),
    },
    {
      slug: "tool-call-card",
      title: "Tool Call Card",
      note: "One readable line per call, foldable arguments and results.",
      category: "agent",
      preview: (
        <div className="lib-tool">
          <ToolCallCard
            name="web.search"
            status="done"
            summary="pricing pages for 5 competitors"
            durationMs={4200}
            args={{ query: "affectui pricing comparison", limit: 5 }}
            result={'{\n  "results": 5,\n  "top": "affectui.com/pricing"\n}'}
          />
        </div>
      ),
    },
    {
      slug: "model-picker",
      title: "Model Picker",
      note: "Model tray with speed, quality, cost and first-token price.",
      category: "agent",
      preview: (
        <div className="lib-models">
          <div className="lib-models__top"><ModelPicker models={MODELS} /></div>
          <div className="lib-models__row is-active"><span>Opus 4.5</span><span className="lib-pro">pro</span></div>
          <div className="lib-models__row"><span>Sonnet 5.5</span><span>default</span></div>
          <div className="lib-models__row"><span>GPT-6 Sol</span><span>fast</span></div>
          <div className="lib-models__bars"><i /><i /><i /></div>
          <div className="lib-models__foot"><span>First token ~0.4s</span><b>$3 in · $15 out / M</b></div>
        </div>
      ),
    },
    {
      slug: "approval-card",
      title: "Approval Card",
      note: "Risk, exact effect, countdown and keyboard shortcuts.",
      category: "agent",
      preview: (
        <div className="lib-approval">
          <div className="lib-approval__head">
            <span className="lib-approval__icon">!</span>
            <div><b>Send campaign email</b><span>gmail.send · medium risk</span></div>
            <span className="lib-approval__risk">medium</span>
          </div>
          <div className="lib-approval__rows">
            <span>To <b>Customers — EU (42)</b></span>
            <span>Subject <b>What&apos;s new in October</b></span>
          </div>
          <div className="lib-approval__foot">Approve <kbd>⌘↵</kbd><span className="lib-approval__clock">0:45</span></div>
        </div>
      ),
    },
    {
      slug: "agent-inbox",
      title: "Agent Inbox",
      note: "Filters, rolling counts and live clocks for every run.",
      category: "agent",
      preview: (
        <div className="lib-inbox">
          <div className="lib-inbox__head">Agent inbox <span className="lib-inbox__live"><span className="lib-live-dot" /> live</span></div>
          <div className="lib-inbox__row"><span className="lib-inbox__dot lib-inbox__dot--run" /> Draft the October newsletter <span>2m</span></div>
          <div className="lib-inbox__row"><span className="lib-inbox__dot lib-inbox__dot--wait" /> Send campaign to EU <span>42s</span></div>
          <div className="lib-inbox__row"><span className="lib-inbox__dot lib-inbox__dot--fail" /> Reconcile invoices <span>1m</span></div>
        </div>
      ),
    },
    {
      slug: "button",
      title: "Button",
      note: "Four variants, three sizes and a loading sweep.",
      category: "inputs",
      preview: (
        <div className="lib-preview-row">
          <Button size="sm">Save changes</Button>
          <Button size="sm" variant="secondary">Cancel</Button>
          <Button size="sm" variant="ghost">Dismiss</Button>
        </div>
      ),
    },
    {
      slug: "segmented-control",
      title: "Segmented Control",
      note: "Measured pill indicator with roving keyboard focus.",
      category: "inputs",
      preview: (
        <SegmentedControl
          ariaLabel="Preview view"
          value="overview"
          onChange={() => undefined}
          options={[
            { value: "overview", label: "Overview" },
            { value: "runs", label: "Runs", count: 12 },
            { value: "cost", label: "Cost" },
          ]}
        />
      ),
    },
    {
      slug: "switch",
      title: "Switch",
      note: "Spring thumb with label and description in one hit area.",
      category: "inputs",
      preview: (
        <Switch
          checked
          onChange={() => undefined}
          label="Run on its own"
          description="Agents may act without asking"
        />
      ),
    },
    {
      slug: "field",
      title: "Field",
      note: "Hairline control with hint, error and affix.",
      category: "inputs",
      preview: (
        <div className="lib-fields">
          <Field label="Project name" defaultValue="affect-ui" hint="Lowercase, no spaces." />
          <Field label="Workspace" defaultValue="not a valid slug" error="Use lowercase letters." />
        </div>
      ),
    },
    {
      slug: "card",
      title: "Card",
      note: "Header, body and footer on one quiet surface.",
      category: "surfaces",
      preview: (
        <div className="lib-card-demo">
          <Card>
            <CardHeader
              title="Research run"
              description="5 sources · 42s · $0.18"
              actions={<Badge tone="accent" dot pulse>Running</Badge>}
            />
            <CardBody>
              <p className="doc-hint">Comparing pricing across five competitors, then drafting a short brief.</p>
            </CardBody>
          </Card>
        </div>
      ),
    },
    {
      slug: "badge",
      title: "Badge",
      note: "Tonal statuses that stay calm in a row.",
      category: "surfaces",
      preview: (
        <div className="lib-preview-row">
          <Badge>Neutral</Badge>
          <Badge tone="accent" dot pulse>Running</Badge>
          <Badge tone="ok" dot>Done</Badge>
          <Badge tone="warn" dot>Waiting</Badge>
          <Badge tone="danger" dot>Failed</Badge>
        </div>
      ),
    },
    {
      slug: "avatar",
      title: "Avatar",
      note: "Deterministic initials, status rings and stacks.",
      category: "surfaces",
      preview: (
        <div className="lib-preview-row">
          <Avatar name="Ada Lovelace" size={34} status="online" />
          <Avatar name="Grace Hopper" size={34} status="busy" />
          <AvatarStack names={["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson"]} size={26} />
        </div>
      ),
    },
    {
      slug: "tooltip",
      title: "Tooltip",
      note: "Dark bubble with an optional keyboard hint.",
      category: "surfaces",
      preview: (
        <div className="lib-tooltip">
          <span className="lib-tooltip__bubble">Copy answer <kbd>⌘C</kbd></span>
          <Button size="sm" variant="secondary" icon={<CopyIcon size={13} />}>Copy</Button>
        </div>
      ),
    },
    {
      slug: "meter",
      title: "Meter",
      note: "Linear and ring measures with threshold tones.",
      category: "surfaces",
      preview: (
        <div className="lib-meter">
          <Meter value={0.68} label="Context window" detail="68% of 200k" />
          <Meter value={0.92} label="Daily credits" detail="92%" tone="warn" />
        </div>
      ),
    },
  ];

  const counts: Record<LibraryFilter, number> = {
    all: items.length,
    chat: items.filter((item) => item.category === "chat").length,
    agent: items.filter((item) => item.category === "agent").length,
    inputs: items.filter((item) => item.category === "inputs").length,
    surfaces: items.filter((item) => item.category === "surfaces").length,
  };
  const visible = items.filter((item) => filter === "all" || item.category === filter);

  return (
    <section className="library">
      <h1 className="page-title">Agent-ready UI for AI products – one file each, no dependencies.</h1>
      <div className="library-tabs" role="group" aria-label="Component categories">
        {LIBRARY_FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="library-tab"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
            <span className="library-tab__count">{counts[entry.id]}</span>
          </button>
        ))}
      </div>
      <div className="library-grid">
        {visible.map(({ preview, ...item }) => (
          <LibraryCard key={item.slug} {...item}>
            {preview}
          </LibraryCard>
        ))}
      </div>
    </section>
  );
}

export function ComponentsPage() {
  return (
    <>
      <LibraryIndex />

      <ComponentSection
        title="Actions & input"
        lead="Pill controls, hairline fields and a segmented indicator that glides between measured positions."
        count={4}
      >
        <ButtonSpecimen />
        <SegmentedSpecimen />
        <SwitchSpecimen />
        <FieldSpecimen />
      </ComponentSection>

      <ComponentSection
        title="Surfaces & data"
        lead="The quiet vocabulary: one card anatomy, tonal badges, deterministic avatars and meters that read at a glance."
        count={5}
      >
        <CardSpecimen />
        <BadgeSpecimen />
        <AvatarSpecimen />
        <TooltipSpecimen />
        <MeterSpecimen />
      </ComponentSection>

      <ComponentSection
        title="Chat"
        lead="The surfaces users spend the most time in. Streaming, phases, citations and feedback, all in one visual voice."
        count={4}
      >
        <ThinkingSpecimen />
        <ComposerSpecimen />
        <AnswerSpecimen />
        <MessageActionsSpecimen />
      </ComponentSection>

      <ComponentSection
        title="Agent operations"
        lead="Work made visible: tool calls, model choice, approvals and the inbox that holds all of it."
        count={4}
      >
        <ToolCallSpecimen />
        <ModelPickerSpecimen />
        <ApprovalSpecimen />
        <InboxSpecimen />
      </ComponentSection>
    </>
  );
}

function ComponentSection({
  title,
  lead,
  count,
  children,
}: {
  title: string;
  lead: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="doc-section">
      <div className="doc-section__head">
        <div className="doc-section__head-main">
          <h2 className="doc-section__title">
            {title} <span className="doc-section__count">{count}</span>
          </h2>
          <p className="doc-section__lead">{lead}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ actions */

function ButtonSpecimen() {
  const [loading, setLoading] = useState(false);
  return (
    <Specimen
      id="spec-button"
      name="Button"
      note="Primary, secondary, ghost and destructive. Press scales to 97%; loading keeps the label readable and sweeps a light band across it."
      meta={["4 variants", "3 sizes", "loading"]}
    >
      <Row gap={6}>
        <Button>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Dismiss</Button>
        <Button variant="destructive" icon={<XIcon size={13} />}>Delete</Button>
      </Row>
      <Row gap={6}>
        <Button size="sm" icon={<PlusIcon size={13} />}>Add item</Button>
        <Button size="md" iconRight={<ArrowUpIcon size={13} />}>Send</Button>
        <Button size="lg" icon={<SparkleIcon size={15} />}>Continue</Button>
        <Button
          variant="secondary"
          loading={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1800);
          }}
        >
          {loading ? "Uploading" : "Upload file"}
        </Button>
      </Row>
      <Row gap={4}>
        <Button size="sm" variant="ghost" icon={<CopyIcon size={14} />} aria-label="Copy link" />
        <Button size="sm" variant="secondary" icon={<FolderIcon size={14} />} aria-label="Move to folder" />
        <Button size="sm" variant="primary" icon={<PaperclipIcon size={14} />} aria-label="Attach" />
        <DemoLabel>Icon-only buttons carry an aria-label</DemoLabel>
      </Row>
      <Snippet>{`<Button variant="secondary" loading={isSaving}>Request approval</Button>
<Button variant="ghost" size="sm" icon={<PlusIcon />} aria-label="Add" />`}</Snippet>
    </Specimen>
  );
}

type TabValue = "overview" | "runs" | "cost";

function SegmentedSpecimen() {
  const [value, setValue] = useState<TabValue>("overview");
  const [underline, setUnderline] = useState<TabValue>("runs");
  return (
    <Specimen
      id="spec-segmented-control"
      name="Segmented control"
      note="A raised pill glides to the measured width of each option. Arrow keys, Home and End move the selection; the indicator never jumps."
      meta={["pill + underline", "keyboard", "counts"]}
    >
      <Row gap={10}>
        <SegmentedControl<TabValue>
          ariaLabel="View"
          value={value}
          onChange={setValue}
          options={[
            { value: "overview", label: "Overview" },
            { value: "runs", label: "Runs", count: 12 },
            { value: "cost", label: "Cost" },
          ]}
        />
        <Badge tone="neutral">{value}</Badge>
      </Row>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <SegmentedControl<TabValue>
          ariaLabel="Run view"
          variant="underline"
          value={underline}
          onChange={setUnderline}
          options={[
            { value: "overview", label: "Trace" },
            { value: "runs", label: "Steps" },
            { value: "cost", label: "Costs" },
          ]}
        />
      </div>
      <Snippet>{`<SegmentedControl value={view} onChange={setView} options={[
  { value: "overview", label: "Overview" },
  { value: "runs", label: "Runs", count: 12 },
]} />`}</Snippet>
    </Specimen>
  );
}

function SwitchSpecimen() {
  const [auto, setAuto] = useState(true);
  const [notify, setNotify] = useState(false);
  return (
    <Specimen
      id="spec-switch"
      name="Switch"
      note="Role=switch, a spring thumb and no colour shift beyond the solid track. Label and description stay inside the control for a larger hit area."
      meta={["role=switch", "3 sizes"]}
    >
      <Row gap={18}>
        <Switch
          checked={auto}
          onChange={setAuto}
          label="Run on its own"
          description="Agents may act without asking"
        />
        <Switch checked={notify} onChange={setNotify} label="Notify on finish" />
        <Switch size="sm" checked={notify} onChange={setNotify} aria-label="Small switch" />
      </Row>
    </Specimen>
  );
}

function FieldSpecimen() {
  const [name, setName] = useState("affect-ui");
  return (
    <Specimen
      id="spec-field"
      name="Field"
      note="A 34px control with a 3px accent wash on focus. Errors are text plus colour, never colour alone."
      meta={["label", "hint", "error", "icons"]}
    >
      <div className="doc-grid doc-grid--2" style={{ width: "100%" }}>
        <Field
          label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          hint="Lowercase, no spaces."
          optional
        />
        <Field
          label="Workspace"
          defaultValue="not a valid slug"
          error="Use lowercase letters, numbers and dashes."
          icon={<SearchIcon size={14} />}
        />
        <Field label="Search runs" placeholder="Filter by agent or tool…" icon={<SearchIcon size={14} />} />
        <Field label="Budget" defaultValue="40.00" affix="USD / month" />
      </div>
    </Specimen>
  );
}

/* ----------------------------------------------------------------- surfaces */

function CardSpecimen() {
  return (
    <Specimen
      id="spec-card"
      name="Card"
      note="One anatomy for everything raised: header, body, footer. Borders are a single hairline; the shadow is a 1px inset, not a glow."
      meta={["header", "body", "footer"]}
    >
      <div className="doc-grid doc-grid--2" style={{ width: "100%" }}>
        <Card>
          <CardHeader
            title="Research run"
            description="5 sources · 42s · $0.18"
            icon={<span className="spec__tag">R1</span>}
            actions={<Badge tone="accent" dot pulse>Running</Badge>}
          />
          <CardBody>
            <p className="doc-hint">
              Comparing pricing across five competitors, then drafting a short brief with citations.
            </p>
          </CardBody>
          <CardFooter>
            <Button size="sm" variant="ghost">Open</Button>
            <Button size="sm" variant="secondary" style={{ marginLeft: "auto" }}>Pause</Button>
          </CardFooter>
        </Card>
        <Card tone="tray" pad="lg">
          <DemoLabel>Tray tone</DemoLabel>
          <p className="doc-hint" style={{ marginTop: 6 }}>
            The same surface at <code>tone="tray"</code> sits one level back — used for stacked
            approvals and inset previews.
          </p>
          <Row gap={4} style={{ marginTop: 10 }}>
            <Badge tone="ok">ready</Badge>
            <Badge tone="warn">needs review</Badge>
          </Row>
        </Card>
      </div>
    </Specimen>
  );
}

function BadgeSpecimen() {
  return (
    <Specimen
      id="spec-badge"
      name="Badge"
      note="Tonal, not saturated. Backgrounds sit at ~10% of the signal colour so a row of badges stays calm."
      meta={["8 tones", "dot", "pulse"]}
    >
      <Row gap={5}>
        <Badge>Neutral</Badge>
        <Badge tone="accent" dot pulse>Running</Badge>
        <Badge tone="ok" dot>Done</Badge>
        <Badge tone="warn" dot>Waiting</Badge>
        <Badge tone="danger" dot>Failed</Badge>
        <Badge tone="brand">Brand</Badge>
        <Badge tone="outline">Outline</Badge>
        <Badge tone="solid">Solid</Badge>
      </Row>
      <Row gap={5}>
        <Badge size="sm">sm</Badge>
        <Badge pill>pill</Badge>
        <Badge tone="ok" size="sm" pill dot>connected</Badge>
      </Row>
    </Specimen>
  );
}

function AvatarSpecimen() {
  return (
    <Specimen
      id="spec-avatar"
      name="Avatar"
      note="Deterministic initials and tints from the name, so the same agent is always the same colour. Stack overlaps by 7px with a card-coloured ring."
      meta={["initials", "status", "stack"]}
    >
      <Row gap={14}>
        <Avatar name="Ada Lovelace" size={34} status="online" />
        <Avatar name="Grace Hopper" size={34} status="busy" />
        <Avatar name="Alan Turing" size={34} status="idle" />
        <AvatarStack names={["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson", "Margaret Hamilton"]} size={26} />
        <Avatar name="Research agent" square size={30} />
      </Row>
    </Specimen>
  );
}

function TooltipSpecimen() {
  return (
    <Specimen
      id="spec-tooltip"
      name="Tooltip"
      note="Dark solid bubble, 6px padding, optional keyboard hint. Opens on hover and focus-within, and links via aria-describedby."
      meta={["top", "bottom", "shortcut"]}
    >
      <Row gap={10}>
        <Tooltip content="Copy answer" shortcut="⌘C">
          <Button size="sm" variant="secondary" icon={<CopyIcon size={13} />}>Copy</Button>
        </Tooltip>
        <Tooltip content="Re-run from the failed step" shortcut="⌘R" side="bottom">
          <Button size="sm" variant="ghost" icon={<RefreshIcon size={13} />}>Retry</Button>
        </Tooltip>
        <Tooltip content="Approve and remember for this action" side="bottom">
          <Button size="sm" icon={<ShieldIcon size={13} />}>Allow always</Button>
        </Tooltip>
      </Row>
    </Specimen>
  );
}

function MeterSpecimen() {
  const [value, setValue] = useState(0.68);
  return (
    <Specimen
      id="spec-meter"
      name="Meter & ring"
      note="Track at 6% fill, rounded ends, width and dash offset on the morph curve. Colour only changes when the metric crosses a threshold."
      meta={["linear", "ring", "tones"]}
    >
      <div className="doc-grid doc-grid--2" style={{ width: "100%", alignItems: "center" }}>
        <Col gap={12}>
          <Meter value={value} label="Context window" detail={`${Math.round(value * 100)}% of 200k`} />
          <Meter value={0.92} label="Daily credits" detail="92%" tone={value > 0.8 ? "danger" : "warn"} />
          <Meter value={0.34} label="Tools used" detail="7 of 20" tone="accent" />
          <Row gap={6}>
            <DemoLabel>Simulate</DemoLabel>
            <input
              className="ds__range"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
              aria-label="Meter value"
            />
          </Row>
        </Col>
        <Row gap={14} style={{ justifyContent: "center" }}>
          <Ring value={value} size={64} stroke={5} tone={value > 0.8 ? "warn" : "solid"}>
            {Math.round(value * 100)}%
          </Ring>
          <Ring value={0.42} size={46} stroke={4} tone="ok">
            42
          </Ring>
          <Ring value={0.86} size={46} stroke={4} tone="accent" />
        </Row>
      </div>
    </Specimen>
  );
}

/* --------------------------------------------------------------------- chat */

function ThinkingSpecimen() {
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <Specimen
      id="spec-thinking-loader"
      name="Thinking loader"
      note="Eight rays, one shimmering label that rolls through phases, then settles into a check with elapsed time. The whole pill is a polite live region."
      meta={["phases", "done", "pill + plain"]}
    >
      <Row gap={8}>
        <ThinkingLoader key={run} done={done} interval={1500} />
        <ThinkingLoader size="sm" variant="plain" phases={["Searching", "Reading", "Writing"]} interval={1700} />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setDone(false);
            setRun((prev) => prev + 1);
            window.setTimeout(() => setDone(true), 2600);
          }}
        >
          Run to done
        </Button>
      </Row>
      <Snippet>{`<ThinkingLoader
  phases={["Thinking", "Searching the web", "Reading sources", "Writing response"]}
  done={streaming}
/>`}</Snippet>
    </Specimen>
  );
}

function ComposerSpecimen() {
  const [sent, setSent] = useState("Nothing sent yet.");
  return (
    <Specimen
      id="spec-chat-composer"
      name="Chat composer"
      note="White card, 18px radius, hairline focus. Enter sends, Shift+Enter breaks a line; menus keep focus on their trigger and expose aria-activedescendant."
      meta={["menus", "dictation", "approval"]}
      demoClassName="spec__demo--plain"
    >
      <ChatComposer
        onSend={(message, details) => setSent(`Sent to ${details.model}: “${message}”`)}
        onAttach={() => setSent("Attachment picker requested")}
        onRequestApproval={() => setSent("Approval requested")}
      />
      <span className="doc-hint">{sent}</span>
      <Snippet>{`<ChatComposer onSend={(message, { model }) => send(message, model)} />`}</Snippet>
    </Specimen>
  );
}

const SOURCES: AnswerSource[] = [
  { name: "Notion", title: "Offsite plan — shortlist and budget", snippet: "Budget €4,500 for three nights, two workshops and travel.", href: "https://www.notion.so" },
  { name: "Slack", title: "#team-offsite — who can make which dates", snippet: "11 of 14 confirmed the second week of October.", href: "https://slack.com" },
  { name: "Linear", title: "OFF-142 · Book the venue", snippet: "Waiting on the deposit approval from finance.", href: "https://linear.app" },
];

const ANSWER = `The shortlist points to **Lisbon** for the second week of October — it fits the €4,500 budget and 11 of 14 people are available [1][2].

- **Venue:** a converted studio near Príncipe Real, €1,900 for three nights [1]
- **Workshops:** two half-days, leaving the afternoons free [3]
- **Risk:** the deposit needs finance approval before 24 September [3]

If the date slips a week, the venue drops to €1,650 — but two people can no longer join [2].`;

function AnswerSpecimen() {
  const [run, setRun] = useState(0);
  return (
    <Specimen
      id="spec-ai-answer"
      name="AI answer"
      note="A tiny markdown dialect: blank lines are paragraphs, “-” is a list, **bold**, and [1] or [1,3] become citation chips with source previews. Actions appear only when writing stops."
      meta={["streaming", "citations", "feedback"]}
      demoClassName="spec__demo--plain"
      aside={
        <Button size="sm" variant="ghost" icon={<RefreshIcon size={12} />} onClick={() => setRun((prev) => prev + 1)}>
          Replay
        </Button>
      }
    >
      <AIAnswer
        key={run}
        question="Where should we hold the team offsite?"
        sources={SOURCES}
        answer={ANSWER}
        speed={70}
        followUps={["What would the deposit be?", "Compare with Porto", "Draft the invite"]}
        onFollowUp={() => undefined}
        onRegenerate={() => setRun((prev) => prev + 1)}
      />
    </Specimen>
  );
}

function MessageActionsSpecimen() {
  const [last, setLast] = useState("No action yet");
  return (
    <Specimen
      id="spec-message-actions"
      name="Message actions"
      note="Copy becomes a check, regenerate spins and unfolds a version switcher, feedback pops, read-aloud becomes a five-bar equaliser."
      meta={["copy", "versions", "equaliser"]}
    >
      <Col gap={10}>
        <MessageActions
          text="The offsite budget is €4,500 for three nights."
          onCopy={() => setLast("Copied to clipboard")}
          onFeedback={(value) => setLast(`Feedback: ${value}`)}
          onRegenerate={() => setLast("Regenerating — version added")}
        />
        <MessageActions labels versions={2} text="With labels" />
        <span className="doc-hint">{last}</span>
      </Col>
    </Specimen>
  );
}

/* -------------------------------------------------------------------- agent */

function ToolCallSpecimen() {
  return (
    <Specimen
      id="spec-tool-call-card"
      name="Tool call card"
      note="One readable line per call. Fold it open for highlighted arguments and the result; errors keep the retry beside the message."
      meta={["running", "done", "error", "retry"]}
      demoClassName="spec__demo--plain"
    >
      <Col gap={7} style={{ width: "100%" }}>
        <ToolCallCard
          name="web.search"
          status="done"
          summary="pricing pages for 5 competitors"
          durationMs={4200}
          args={{ query: "affectUI pricing comparison", limit: 5, region: "eu" }}
          result={'{\n  "results": 5,\n  "top": "affectui.com/pricing",\n  "cached": false\n}'}
          defaultOpen
        />
        <ToolCallCard
          name="gmail.send"
          status="running"
          summary="October product update"
          durationMs={1200}
          args={{ to: "customers-eu", subject: "What's new in October" }}
        />
        <ToolCallCard
          name="stripe.charge"
          status="error"
          summary="card declined"
          durationMs={2400}
          error="The card was declined by the issuer. The run stopped before the receipt was written."
          args={{ amount: 2400, currency: "eur" }}
          onRetry={() => undefined}
        />
      </Col>
      <Snippet>{`<ToolCallCard name="web.search" status="done" args={args} result={result} />`}</Snippet>
    </Specimen>
  );
}

const MODELS: ModelOption[] = [
  { id: "auto", name: "Auto", description: "Picks per task", speed: 0.8, quality: 0.82, cost: 0.5, firstTokenMs: 380, priceIn: 3, priceOut: 15 },
  { id: "sonnet", name: "Sonnet 5.5", description: "Balanced, long context", speed: 0.68, quality: 0.9, cost: 0.62, firstTokenMs: 520, priceIn: 3, priceOut: 15, tag: "default" },
  { id: "sol", name: "GPT-6 Sol", description: "Fast tools, short answers", speed: 0.94, quality: 0.74, cost: 0.28, firstTokenMs: 240, priceIn: 1.5, priceOut: 8 },
  { id: "opus", name: "Opus 4.5", description: "Hardest reasoning", speed: 0.34, quality: 0.98, cost: 0.95, firstTokenMs: 1100, priceIn: 15, priceOut: 75, tag: "pro" },
];

function ModelPickerSpecimen() {
  return (
    <Specimen
      id="spec-model-picker"
      name="Model picker"
      note="Point at a model and its speed, quality and cost bars fill; the tray rolls the first-token time and price. Extended thinking unfolds its effort control in place."
      meta={["bars", "thinking", "tray"]}
    >
      <ModelPicker models={MODELS} />
      <span className="doc-hint">Open the menu and move the pointer between rows.</span>
    </Specimen>
  );
}

function ApprovalSpecimen() {
  return (
    <Specimen
      id="spec-approval-card"
      name="Approval card"
      note="The card states who asks, exactly what will happen and why. ⌘↵ approves, Esc denies; the countdown pauses on hover and focus, then expires into a denied row."
      meta={["risk", "countdown", "shortcuts", "morph"]}
      demoClassName="spec__demo--plain"
    >
      <div className="doc-grid doc-grid--2" style={{ width: "100%", alignItems: "start" }}>
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
          expiresIn={45}
          onApprove={() => new Promise<void>((resolve) => window.setTimeout(resolve, 900))}
          onDeny={() => undefined}
          onEdit={() => undefined}
        />
        <ApprovalCard
          title="Delete 12 project files"
          description="Archived drafts in /marketing/2025"
          risk="high"
          icon={<XIcon size={15} />}
          preview={
            <div className="doc-hint">
              12 files · 48 MB<br />
              <span style={{ color: "var(--ui-danger)" }}>This cannot be undone.</span>
            </div>
          }
          allowAlways={false}
          approveLabel="Delete files"
          onDeny={() => undefined}
        />
      </div>
    </Specimen>
  );
}

const TASKS: AgentTask[] = [
  {
    id: "t1",
    title: "Draft the October newsletter",
    agent: "Writer agent",
    status: "running",
    elapsedMs: 128_000,
    cost: 0.18,
    steps: ["Collect the changelog", "Pick three highlights", "Write the draft", "Check links"],
    currentStep: 2,
  },
  {
    id: "t2",
    title: "Send campaign to EU customers",
    agent: "Ops agent",
    status: "waiting",
    elapsedMs: 42_000,
    cost: 0.42,
    steps: ["Build the audience", "Render the template", "Wait for approval"],
    currentStep: 2,
  },
  {
    id: "t3",
    title: "Reconcile September invoices",
    agent: "Finance agent",
    status: "failed",
    elapsedMs: 96_000,
    cost: 0.07,
    steps: ["Pull Stripe charges", "Match to ledger", "Write the summary"],
    currentStep: 1,
  },
  {
    id: "t4",
    title: "Summarise competitor pricing",
    agent: "Research agent",
    status: "done",
    elapsedMs: 55_000,
    cost: 0.11,
    steps: ["Find pricing pages", "Extract tiers", "Compare with ours"],
  },
];

function InboxSpecimen() {
  const [last, setLast] = useState("");
  return (
    <Specimen
      id="spec-agent-inbox"
      name="Agent inbox"
      note="Filter tabs carry rolling counts, running clocks tick, and rows unfold to the last steps with the action that fits their state."
      meta={["filters", "live clocks", "actions"]}
      demoClassName="spec__demo--plain"
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <AgentInbox tasks={TASKS} onAction={(task, action) => setLast(`${action} · ${task.title}`)} />
      </div>
      {last ? <span className="doc-hint">Last action → {last}</span> : null}
    </Specimen>
  );
}
