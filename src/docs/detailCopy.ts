export interface DetailExample {
  title: string;
  code: string;
}

export interface DetailCopy {
  use: string[];
  avoid: string[];
  usage: string;
  examples: DetailExample[];
  relatedTitle?: string;
}

/**
 * Per-component prose and examples for the shared detail template. API metadata
 * lives in detailData.ts; this file holds the long-form documentation that must
 * differ between components so the page is not a generic shell.
 */
export const DETAIL_COPY: Record<string, DetailCopy> = {
  "ai-answer": {
    use: [
      "When an answer needs sources, inline citations and visible reasoning about where the information came from",
      "When a reader may want to ask a follow-up without restating the original question",
    ],
    avoid: [
      "For a one-line confirmation that has no sources or follow-up value",
      "For raw chain-of-thought; summarise the useful conclusion instead",
    ],
    usage: `import { AIAnswer } from "@copyui/ai-answer";

export function Answer() {
  return (
    <AIAnswer
      streaming
      sources={sources}
      followUps={["Draft the agenda", "Compare venues"]}
    >
      Lisbon fits the €4,500 budget and 11 of 14 can make October.
    </AIAnswer>
  );
}`,
    examples: [
      {
        title: "With citations",
        code: `<AIAnswer sources={sources}>
  <p>
    The studio costs <b>€1,900</b> for three nights
    <span className="lib-cite">1</span>.
  </p>
</AIAnswer>`,
      },
      {
        title: "Follow-ups",
        code: `<AIAnswer
  sources={sources}
  followUps={["Draft the agenda", "Compare venues"]}
>
  Two venues fit the budget and the dates.
</AIAnswer>`,
      },
    ],
  },
  "chat-composer": {
    use: [
      "The main input of an AI assistant or agent that can act on connected tools",
      "Flows where the user has to grant extra permissions before a run",
    ],
    avoid: [
      "Plain chat between people – a simple text field with a send button is enough",
      "Very narrow spaces below ~280px, where the toolbar labels get too small",
    ],
    usage: `import { ChatComposer } from "@copyui/chat-composer";

export function Composer() {
  return (
    <ChatComposer
      placeholder="Start by typing..."
      onSend={(message, details) => {
        console.log(details.model, message);
      }}
    />
  );
}`,
    examples: [
      {
        title: "Folder and apps",
        code: `<ChatComposer
  defaultFolder="Design"
  connectedApps={["gmail", "linear"]}
  onAppsChange={(connected) => saveApps(connected)}
/>`,
      },
      {
        title: "Approval request",
        code: `<ChatComposer
  onRequestApproval={() => openApproval("edit-files")}
  onSend={(message, details) => runAgent(message, details)}
/>`,
      },
    ],
    relatedTitle: "Guides",
  },
  "thinking-loader": {
    use: [
      "When an agent takes longer than a moment and the user needs a calm sign of progress",
      "When a task moves through named phases that explain what is happening",
    ],
    avoid: [
      "For instant local operations that finish before the indicator is readable",
      "As an error state; use a message with a recovery action instead",
    ],
    usage: `import { ThinkingLoader } from "@copyui/thinking-loader";

export function Working() {
  return (
    <ThinkingLoader
      phases={["Thinking", "Searching", "Writing"]}
      interval={2200}
    />
  );
}`,
    examples: [
      {
        title: "Compact",
        code: `<ThinkingLoader
  size="sm"
  phases={["Thinking", "Reading"]}
  interval={1800}
/>`,
      },
      {
        title: "Done",
        code: `<ThinkingLoader
  done
  phases={["Searched 7 sources"]}
/>`,
      },
    ],
  },
  "message-actions": {
    use: [
      "After an assistant answer that can be copied, regenerated or rated",
      "When a response needs a quiet row of secondary actions rather than primary buttons",
    ],
    avoid: [
      "On the user's own message, where editing and deleting are the expected actions",
      "For destructive actions that need a label and confirmation",
    ],
    usage: `import { MessageActions } from "@copyui/message-actions";

export function Actions() {
  return (
    <MessageActions
      text={answer}
      versions={2}
      onFeedback={(value) => saveFeedback(value)}
    />
  );
}`,
    examples: [
      {
        title: "With labels",
        code: `<MessageActions
  labels
  text={answer}
  versions={1}
/>`,
      },
      {
        title: "Multiple versions",
        code: `<MessageActions
  text={answer}
  versions={3}
  onRegenerate={regenerate}
/>`,
      },
    ],
  },
  "tool-call-card": {
    use: [
      "When an agent calls an external tool and the user benefits from seeing what ran",
      "When arguments and raw results need to be available without dominating the answer",
    ],
    avoid: [
      "For internal bookkeeping the user cannot act on",
      "When a short sentence explains the outcome more clearly than a disclosure",
    ],
    usage: `import { ToolCallCard } from "@copyui/tool-call-card";

export function SearchCall() {
  return (
    <ToolCallCard
      name="web.search"
      status="done"
      summary="pricing pages for 5 competitors"
      durationMs={4200}
      args={{ query: "affectui pricing", limit: 5 }}
    />
  );
}`,
    examples: [
      {
        title: "Running",
        code: `<ToolCallCard
  name="web.search"
  status="running"
  summary="reading 3 pages"
/>`,
      },
      {
        title: "Expanded",
        code: `<ToolCallCard
  name="web.search"
  status="done"
  summary="found 5 results"
  args={{ query: "ai design systems" }}
  result={results}
/>`,
      },
    ],
  },
  "model-picker": {
    use: [
      "When a product offers several models with different speed, quality or cost trade-offs",
      "When the current model should stay visible next to the prompt",
    ],
    avoid: [
      "When there is only one model and no choice to make",
      "For provider settings that belong in a settings page rather than the composer",
    ],
    usage: `import { ModelPicker, type ModelOption } from "@copyui/model-picker";

const models: ModelOption[] = [
  { id: "auto", name: "Auto", speed: 0.8, quality: 0.82 },
  { id: "sonnet", name: "Sonnet", speed: 0.68, quality: 0.9 },
];

export function ModelChoice() {
  return <ModelPicker models={models} value={model} onChange={setModel} />;
}`,
    examples: [
      {
        title: "Thinking",
        code: `<ModelPicker
  models={models}
  value={model}
  onChange={setModel}
  thinking
/>`,
      },
      {
        title: "Effort",
        code: `<ModelPicker
  models={models}
  value={model}
  onChange={setModel}
  effort="high"
/>`,
      },
    ],
  },
  "approval-card": {
    use: [
      "Before an agent edits files, spends money or uses the internet",
      "When the exact effect and risk need to be understood before a decision",
    ],
    avoid: [
      "For reversible actions with no meaningful side effect",
      "For informational notices that do not require a decision",
    ],
    usage: `import { ApprovalCard } from "@copyui/approval-card";

export function Approval() {
  return (
    <ApprovalCard
      title="Delete 42 unused assets?"
      risk="high"
      details={[{ label: "Scope", value: "42 files" }]}
      onResolve={(status) => resolveApproval(status)}
    />
  );
}`,
    examples: [
      {
        title: "Pending",
        code: `<ApprovalCard
  title="Push to production?"
  risk="medium"
  details={details}
  onResolve={resolve}
/>`,
      },
      {
        title: "Approved",
        code: `<ApprovalCard
  title="Push to production?"
  risk="medium"
  details={details}
  status="approved"
/>`,
      },
    ],
  },
  "agent-inbox": {
    use: [
      "When several agent runs are active and the user needs to triage them in one place",
      "When run status, elapsed time and the next action matter more than the transcript",
    ],
    avoid: [
      "For a single conversation with no parallel work",
      "For a static task list that does not change while it is open",
    ],
    usage: `import { AgentInbox } from "@copyui/agent-inbox";

export function Inbox() {
  return (
    <AgentInbox
      title="Agent inbox"
      tasks={runs}
      onAction={(task, action) => updateRun(task.id, action)}
    />
  );
}`,
    examples: [
      {
        title: "Running",
        code: `<AgentInbox
  tasks={runs.filter(isRunning)}
  defaultFilter="running"
  onAction={updateRun}
/>`,
      },
      {
        title: "Waiting",
        code: `<AgentInbox
  tasks={runs}
  defaultFilter="waiting"
  title="Waiting for you"
/>`,
      },
    ],
  },
  button: {
    use: [
      "Any action a user triggers: submit a form, send a message, open a dialog",
      "Async actions that take a moment – the loading state keeps the label readable",
    ],
    avoid: [
      "Navigation to another page – use a link so it can be opened in a new tab",
      "Switching between views – a segmented control or tabs show the current state",
    ],
    usage: `import { Button } from "@copyui/button";

export function Actions() {
  return (
    <>
      <Button variant="ghost">Cancel</Button>
      <Button onClick={save}>Save changes</Button>
    </>
  );
}`,
    examples: [
      {
        title: "Destructive",
        code: `<Button
  variant="destructive"
  icon={<TrashIcon />}
  onClick={remove}
>
  Delete
</Button>`,
      },
      {
        title: "With icons",
        code: `<Button iconRight={<ArrowUpIcon />}>Send</Button>
<Button variant="ghost" size="sm" icon={<PlusIcon />} aria-label="Add" />`,
      },
    ],
  },
  "segmented-control": {
    use: [
      "For two to five mutually exclusive views that should stay visible",
      "When switching should feel immediate and preserve the surrounding context",
    ],
    avoid: [
      "For long labels that cannot fit at the narrowest breakpoint",
      "For navigation between pages; use links or tabs with a URL",
    ],
    usage: `import { SegmentedControl } from "@copyui/segmented-control";

export function ViewSwitch() {
  return (
    <SegmentedControl
      options={[
        { value: "preview", label: "Preview" },
        { value: "code", label: "Code" },
      ]}
      value={view}
      onChange={setView}
    />
  );
}`,
    examples: [
      {
        title: "Underline",
        code: `<SegmentedControl
  options={tabs}
  value={tab}
  onChange={setTab}
  variant="underline"
/>`,
      },
      {
        title: "Counts",
        code: `<SegmentedControl
  options={[
    { value: "all", label: "All", count: 24 },
    { value: "open", label: "Open", count: 7 },
  ]}
  value={filter}
  onChange={setFilter}
/>`,
      },
    ],
  },
  switch: {
    use: [
      "For a setting that takes effect immediately and can be reversed",
      "When the label and current state can be read together in one row",
    ],
    avoid: [
      "When pressing a submit button is required before the change applies",
      "When several options can be on at once; use checkboxes",
    ],
    usage: `import { Switch } from "@copyui/switch";

export function Notifications() {
  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      label="Notifications"
      description="Get a note when a run finishes."
    />
  );
}`,
    examples: [
      {
        title: "Small",
        code: `<Switch
  size="sm"
  checked={compact}
  onChange={setCompact}
  label="Compact rows"
/>`,
      },
      {
        title: "With description",
        code: `<Switch
  checked={enabled}
  onChange={setEnabled}
  label="Weekly digest"
  description="A Monday summary of agent activity."
/>`,
      },
    ],
  },
  field: {
    use: [
      "When an input needs a persistent label, hint or error message",
      "When a leading icon or trailing unit makes the expected value clearer",
    ],
    avoid: [
      "Using the placeholder as the only label",
      "For a read-only value that is better presented as text",
    ],
    usage: `import { Field } from "@copyui/field";

export function EmailField() {
  return (
    <Field
      label="Work email"
      hint="We only use this for run notifications."
      placeholder="you@company.com"
    />
  );
}`,
    examples: [
      {
        title: "Error",
        code: `<Field
  label="Workspace"
  value={workspace}
  error="That workspace is already taken."
/>`,
      },
      {
        title: "With affix",
        code: `<Field
  label="Budget"
  icon={<WalletIcon />}
  affix="USD"
  placeholder="4,500"
/>`,
      },
    ],
  },
  card: {
    use: [
      "To group a title, related content and actions on one quiet surface",
      "When a section needs more separation than spacing alone provides",
    ],
    avoid: [
      "Nesting cards inside cards; split the layout or use a tray instead",
      "For a single line of text that does not need a container",
    ],
    usage: `import { Card, CardHeader, CardBody, CardFooter } from "@copyui/card";

export function ProjectCard() {
  return (
    <Card>
      <CardHeader title="Launch plan" meta="Updated 2h ago" />
      <CardBody>12 tasks · 4 owners · due Friday</CardBody>
      <CardFooter><Button size="sm">Open</Button></CardFooter>
    </Card>
  );
}`,
    examples: [
      {
        title: "Tray",
        code: `<Card tone="tray">
  <CardBody>Background work is paused.</CardBody>
</Card>`,
      },
      {
        title: "Interactive",
        code: `<Card interactive onClick={openProject}>
  <CardHeader title="Launch plan" meta="12 tasks" />
  <CardBody>4 owners · due Friday</CardBody>
</Card>`,
      },
    ],
  },
  badge: {
    use: [
      "For a short status, count or category that belongs next to a label",
      "When tone and a dot need to communicate state at a glance",
    ],
    avoid: [
      "For an action; use a button or a link",
      "For long explanatory copy that needs a sentence",
    ],
    usage: `import { Badge } from "@copyui/badge";

export function Status() {
  return (
    <Badge tone="success" dot>
      Active
    </Badge>
  );
}`,
    examples: [
      {
        title: "Live",
        code: `<Badge tone="accent" dot pulse>
  Running
</Badge>`,
      },
      {
        title: "Outline",
        code: `<Badge tone="neutral" outline>
  Draft
</Badge>`,
      },
    ],
  },
  avatar: {
    use: [
      "To identify a person or agent in a row, comment or activity trail",
      "When status and identity need to stay legible at small sizes",
    ],
    avoid: [
      "As a decorative image with no identity behind it",
      "For a group so large that initials stop being distinguishable",
    ],
    usage: `import { Avatar } from "@copyui/avatar";

export function Owner() {
  return <Avatar name="Maya Chen" status="online" size={28} />;
}`,
    examples: [
      {
        title: "Square",
        code: `<Avatar
  name="Maya Chen"
  square
  size={32}
/>`,
      },
      {
        title: "Stack",
        code: `<AvatarStack
  names={["Maya Chen", "Noah Park", "Iris Bell"]}
  size={24}
  max={3}
/>`,
      },
    ],
  },
  tooltip: {
    use: [
      "To name an icon-only control or add one short hint",
      "When a keyboard shortcut is useful but not essential",
    ],
    avoid: [
      "For information a user must read before acting",
      "As the only way to reach an action on a touch screen",
    ],
    usage: `import { Tooltip } from "@copyui/tooltip";

export function CopyHint() {
  return (
    <Tooltip content="Copy link" shortcut="⌘C">
      <Button variant="ghost" icon={<CopyIcon />} aria-label="Copy link" />
    </Tooltip>
  );
}`,
    examples: [
      {
        title: "Bottom",
        code: `<Tooltip content="Open settings" side="bottom">
  <Button variant="ghost" icon={<SettingsIcon />} aria-label="Settings" />
</Tooltip>`,
      },
      {
        title: "With shortcut",
        code: `<Tooltip content="Send message" shortcut="⌘↵">
  <button aria-label="Send message"><ArrowUpIcon /></button>
</Tooltip>`,
      },
    ],
  },
  meter: {
    use: [
      "To show progress, capacity or consumption against a known limit",
      "When a threshold needs a quiet warning before it becomes an error",
    ],
    avoid: [
      "When the exact value is the primary information; show a number instead",
      "For indeterminate work with no measurable progress",
    ],
    usage: `import { Meter } from "@copyui/meter";

export function ContextUse() {
  return (
    <Meter
      value={0.72}
      label="Context used"
      detail="72%"
    />
  );
}`,
    examples: [
      {
        title: "Ring",
        code: `<Ring
  value={0.64}
  label="Monthly budget"
  detail="$640"
/>`,
      },
      {
        title: "Warning",
        code: `<Meter
  value={0.92}
  tone="warn"
  label="Storage"
  detail="92%"
/>`,
      },
    ],
  },
};
