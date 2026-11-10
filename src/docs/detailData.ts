import { DETAIL_COPY, type DetailExample } from "./detailCopy";

export interface DetailProp {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export interface DetailBase {
  description: string;
  props: DetailProp[];
  variants: string[];
}

export interface DetailMeta extends DetailBase {
  whenToUse: string[];
  whenNotToUse: string[];
  usage: string;
  examples: DetailExample[];
  relatedTitle: string;
  keyboard: Array<{ keys: string; action: string }>;
  accessibility: string[];
  motion: string[];
  responsive: string[];
}

/**
 * Content for the shared component-detail template. Gallery inventory, previews
 * and navigation come from LIBRARY_ITEMS; this registry adds the API copy that
 * is specific to each component.
 */
export const DETAIL_META: Record<string, DetailBase> = {
  "ai-answer": {
    description:
      "A streamed answer with sources, inline citations, feedback and follow-up prompts.",
    props: [
      { name: "answer", type: "string", description: "The answer body. Markdown-style line breaks are preserved." },
      { name: "sources", type: "AnswerSource[]", defaultValue: "[]", description: "Source cards and their citation indexes." },
      { name: "streaming", type: "boolean", defaultValue: "false", description: "Shows the live writing state." },
      { name: "followUps", type: "string[]", defaultValue: "[]", description: "Suggested next questions." },
    ],
    variants: ["Streaming", "Complete", "With citations", "Follow-ups"],
  },
  "chat-composer": {
    description:
      "Prompt composer with model picker, voice input, app connections and approval request.",
    props: [
      { name: "placeholder", type: "string", defaultValue: '"Start by typing..."', description: "Placeholder of the message field" },
      { name: "models", type: "ChatModel[]", defaultValue: "defaultModels", description: "Entries of the model picker (Auto, the Claude 5 models, GPT-5) – id, name, logo and an optional description; the first is selected" },
      { name: "dictation", type: "string", defaultValue: '"Draft a short update…"', description: "Demo transcript that appears word by word in gray while recording – replace with real speech-to-text" },
      { name: "onSend", type: "(message: string, details: { model: string }) => void", description: "Called on send or Enter" },
      { name: "onModelChange", type: "(model: ChatModel) => void", description: "Called when a model is picked" },
      { name: "onAttach", type: "(item: string) => void", description: "Called with the entry picked in the plus menu – files, claude, folder (also opens the folder picker), goal, plan (toggles plan mode), skill, draw, documents or pdf" },
      { name: "approval", type: '"ask" | "auto" | "full"', defaultValue: '"ask"', description: "The approval mode to start with: Request approval, Approve for me or Full access" },
      { name: "onApprovalChange", type: "(mode: ApprovalMode) => void", description: "Called when a mode is picked in the approval menu" },
      { name: "onLearnMore", type: "() => void", description: "Called by “Learn more” in the approval menu" },
      { name: "folders", type: "string[]", defaultValue: "defaultFolders", description: "Folders in the “Work in a folder” picker at the bottom left; an empty list leaves it out" },
      { name: "folder", type: "string", description: "The folder to start in – the row shows its name instead of “Work in a folder”" },
      { name: "onFolderChange", type: "(folder: string | null) => void", description: "Called when a folder is picked; null when the picked folder is picked again to leave it" },
      { name: "apps", type: "ChatApp[]", defaultValue: "defaultApps", description: "Apps in the “Connect apps” menu at the bottom right (Gmail, Slack, ClickUp) – id, name and logo; the first three show their marks in the row" },
      { name: "connectedApps", type: "string[]", defaultValue: '["gmail"]', description: "Ids of the apps that are connected to start with" },
      { name: "onAppsChange", type: "(connected: string[]) => void", description: "Called when an app is connected or disconnected, with the ids of all connected apps" },
      { name: "foot", type: "ReactNode", description: "Your own last row on the gray layer, in place of “Work in a folder” and “Connect apps”" },
      { name: "tray", type: "boolean", defaultValue: "true", description: "The gray layer with the folder and the apps. Turn it off once a chat has started: no folder to pick any more, the apps move into the plus menu" },
    ],
    variants: ["Default", "Folder selected", "Recording", "Approval request"],
  },
  "thinking-loader": {
    description:
      "A quiet working indicator that rolls through phases and settles into a done state.",
    props: [
      { name: "phases", type: "string[]", description: "Labels cycled while the agent works." },
      { name: "interval", type: "number", defaultValue: "2200", description: "Milliseconds between phases." },
      { name: "size", type: '"sm" | "md"', defaultValue: '"md"', description: "Pill size." },
      { name: "variant", type: '"pill" | "plain"', defaultValue: '"pill"', description: "Bordered pill or inline treatment." },
      { name: "done", type: "boolean", defaultValue: "false", description: "Shows the settled check state." },
    ],
    variants: ["Pill", "Plain", "Done"],
  },
  "message-actions": {
    description:
      "Copy, regenerate, feedback and read-aloud controls in a single restrained row.",
    props: [
      { name: "text", type: "string", description: "Text copied by the copy action." },
      { name: "versions", type: "number", defaultValue: "1", description: "Regeneration count shown beside the control." },
      { name: "labels", type: "boolean", defaultValue: "false", description: "Shows text labels next to icons." },
      { name: "onFeedback", type: '(value: "up" | "down") => void', description: "Feedback callback." },
    ],
    variants: ["Icon only", "With labels", "Multiple versions"],
  },
  "tool-call-card": {
    description:
      "One readable line per tool call, with arguments and results folded behind it.",
    props: [
      { name: "name", type: "string", description: "Tool name shown in the row." },
      { name: "status", type: '"running" | "done" | "error"', defaultValue: '"done"', description: "Call state and icon treatment." },
      { name: "summary", type: "ReactNode", description: "The short human-readable outcome." },
      { name: "args", type: "Record<string, unknown>", description: "Arguments available in the disclosure." },
      { name: "result", type: "string", description: "Raw result shown when expanded." },
      { name: "durationMs", type: "number", defaultValue: "0", description: "Elapsed time shown at the end of the row." },
    ],
    variants: ["Running", "Done", "Error", "Expanded"],
  },
  "model-picker": {
    description:
      "A model tray with speed, quality, cost and first-token estimates for each choice.",
    props: [
      { name: "models", type: "ModelOption[]", description: "Model rows and their metadata." },
      { name: "value", type: "string", description: "Controlled selected model." },
      { name: "onChange", type: "(model) => void", description: "Selection callback." },
      { name: "thinking", type: "boolean", defaultValue: "true", description: "Shows the reasoning toggle." },
      { name: "effort", type: '"low" | "medium" | "high"', defaultValue: '"medium"', description: "Selected reasoning effort." },
    ],
    variants: ["Default", "Thinking", "Effort"],
  },
  "approval-card": {
    description:
      "Risk, exact effect, countdown and keyboard shortcuts for a decision that matters.",
    props: [
      { name: "title", type: "string", description: "Action waiting for approval." },
      { name: "risk", type: '"low" | "medium" | "high"', defaultValue: '"medium"', description: "Tone and urgency of the request." },
      { name: "details", type: "ApprovalDetail[]", description: "Key/value rows describing the effect." },
      { name: "status", type: "ApprovalStatus", description: "Pending, approved or denied state." },
      { name: "onResolve", type: "(status) => void", description: "Decision callback." },
    ],
    variants: ["Pending", "Approved", "Denied", "High risk"],
  },
  "agent-inbox": {
    description:
      "Filters, rolling counts and live clocks for every agent run in one place.",
    props: [
      { name: "tasks", type: "AgentTask[]", description: "Runs and their current state." },
      { name: "title", type: "string", defaultValue: '"Agent inbox"', description: "Inbox heading." },
      { name: "defaultFilter", type: "InboxFilter", defaultValue: '"all"', description: "Initial filter." },
      { name: "onAction", type: "(task, action) => void", description: "Approve, reject, retry or pause callback." },
    ],
    variants: ["All runs", "Running", "Waiting", "Failed"],
  },
  button: {
    description:
      "Primary, secondary, ghost and destructive actions with three sizes and a loading sweep.",
    props: [
      { name: "variant", type: '"primary" | "secondary" | "ghost" | "destructive"', defaultValue: '"primary"', description: "Visual role of the control." },
      { name: "size", type: '"sm" | "md" | "lg"', defaultValue: '"md"', description: "Control height and type scale." },
      { name: "loading", type: "boolean", defaultValue: "false", description: "Keeps the label and sweeps a light band." },
      { name: "icon / iconRight", type: "ReactNode", description: "Leading or trailing icon." },
    ],
    variants: ["Primary", "Secondary", "Ghost", "Destructive", "Loading"],
  },
  "segmented-control": {
    description:
      "A raised pill glides between measured options, with roving keyboard focus.",
    props: [
      { name: "options", type: "SegmentOption<T>[]", description: "Labels, values and optional counts." },
      { name: "value", type: "T", description: "Controlled selection." },
      { name: "onChange", type: "(value: T) => void", description: "Selection callback." },
      { name: "variant", type: '"pill" | "underline"', defaultValue: '"pill"', description: "Indicator treatment." },
      { name: "size", type: '"sm" | "md"', defaultValue: '"md"', description: "Control height." },
    ],
    variants: ["Pill", "Underline", "Counts"],
  },
  switch: {
    description:
      "A spring thumb with label and description inside one generous hit area.",
    props: [
      { name: "checked", type: "boolean", description: "Controlled on/off state." },
      { name: "onChange", type: "(checked: boolean) => void", description: "Change callback." },
      { name: "label / description", type: "ReactNode", description: "Copy inside the hit area." },
      { name: "size", type: '"sm" | "md" | "lg"', defaultValue: '"md"', description: "Track and thumb size." },
    ],
    variants: ["Small", "Default", "Large", "With description"],
  },
  field: {
    description:
      "A 34px control with hint, error, optional affix and a quiet focus wash.",
    props: [
      { name: "label", type: "ReactNode", description: "Field label." },
      { name: "hint", type: "ReactNode", description: "Helper copy below the control." },
      { name: "error", type: "string | boolean", description: "Error state and message." },
      { name: "icon", type: "ReactNode", description: "Leading icon." },
      { name: "affix", type: "ReactNode", description: "Trailing unit or action." },
    ],
    variants: ["Default", "Hint", "Error", "With affix"],
  },
  card: {
    description:
      "Header, body and footer on one quiet surface, with tray and wash tones.",
    props: [
      { name: "pad", type: '"none" | "sm" | "md" | "lg"', defaultValue: '"md"', description: "Inner spacing." },
      { name: "tone", type: '"card" | "tray" | "wash"', defaultValue: '"card"', description: "Surface tone." },
      { name: "interactive", type: "boolean", defaultValue: "false", description: "Adds hover and focus treatment." },
      { name: "flush", type: "boolean", defaultValue: "false", description: "Removes the outer padding." },
    ],
    variants: ["Card", "Tray", "Wash", "Interactive"],
  },
  badge: {
    description:
      "Tonal statuses that stay calm in a row, with optional dot and pulse.",
    props: [
      { name: "tone", type: "BadgeTone", defaultValue: '"neutral"', description: "Signal colour." },
      { name: "dot", type: "boolean", defaultValue: "false", description: "Adds a status dot." },
      { name: "pulse", type: "boolean", defaultValue: "false", description: "Marks live work." },
      { name: "size", type: '"sm" | "md"', defaultValue: '"md"', description: "Badge height and type." },
    ],
    variants: ["Neutral", "Accent", "Success", "Warning", "Danger", "Outline"],
  },
  avatar: {
    description:
      "Deterministic initials, status rings and overlapping stacks for agents and people.",
    props: [
      { name: "name", type: "string", description: "Name used for initials and colour." },
      { name: "size", type: "number", defaultValue: "24", description: "Avatar diameter in pixels." },
      { name: "status", type: '"online" | "busy" | "idle"', description: "Status ring." },
      { name: "square", type: "boolean", defaultValue: "false", description: "Rounded-square treatment." },
    ],
    variants: ["Initials", "Status", "Square", "Stack"],
  },
  tooltip: {
    description:
      "A dark bubble with an optional keyboard hint that opens on hover and focus.",
    props: [
      { name: "content", type: "ReactNode", description: "Bubble content." },
      { name: "shortcut", type: "string", description: "Keyboard hint." },
      { name: "side", type: '"top" | "bottom"', defaultValue: '"top"', description: "Bubble placement." },
    ],
    variants: ["Top", "Bottom", "With shortcut"],
  },
  meter: {
    description:
      "Linear and ring measures with threshold tones and an optional striped fill.",
    props: [
      { name: "value", type: "number", description: "Progress between 0 and 1." },
      { name: "label", type: "string", description: "Measure name." },
      { name: "detail", type: "string", description: "Right-aligned value or context." },
      { name: "tone", type: '"solid" | "accent" | "warn" | "danger"', defaultValue: '"solid"', description: "Fill colour." },
      { name: "striped", type: "boolean", defaultValue: "false", description: "Striped progress fill." },
    ],
    variants: ["Meter", "Ring", "Warning", "Striped"],
  },
};

function keyboardFor(slug: string, title: string, category: string) {
  if (slug === "chat-composer") {
    return [
      { keys: "Enter", action: "Send the message" },
      { keys: "Shift + Enter", action: "New line" },
      { keys: "Enter or Space or ↓", action: "Open the menu of the focused button – plus, approval, model, folder or apps" },
      { keys: "↑ or ↓", action: "Move through an open menu" },
      { keys: "Home or End", action: "Jump to the first or last entry of a menu" },
      { keys: "Enter or Space", action: "Pick the highlighted entry (in a menu); in the apps menu it connects or disconnects the app" },
      { keys: "Esc", action: "Close a menu and return to its button, or discard a recording" },
      { keys: "Tab", action: "Close a menu and move on from its button" },
    ];
  }
  if (slug === "field") {
    return [
      { keys: "Tab", action: "Move between the label, control and affix" },
      { keys: "Enter", action: "Submit the surrounding form" },
      { keys: "Esc", action: "Clear an open suggestion list" },
    ];
  }
  if (category === "chat" || category === "agent") {
    return [
      { keys: "Tab", action: `Move through ${title}'s controls` },
      { keys: "Enter / Space", action: "Activate the focused control" },
      { keys: "Esc", action: "Close an open menu and return focus" },
    ];
  }
  return [
    { keys: "Tab", action: "Move focus into and through the component" },
    { keys: "Enter / Space", action: "Activate the focused control" },
    { keys: "Esc", action: "Dismiss a transient layer" },
  ];
}

export function detailFor(slug: string, title: string, note: string, category: string): DetailMeta {
  const base: DetailBase = DETAIL_META[slug] ?? {
    description: note,
    props: [],
    variants: ["Default"],
  };
  const copy = DETAIL_COPY[slug];
  const name = title.replace(/[^a-zA-Z0-9]/g, "");

  return {
    ...base,
    whenToUse: copy?.use ?? [note],
    whenNotToUse: copy?.avoid ?? ["When a simpler native control already communicates the action."],
    usage:
      copy?.usage ??
      `import { ${name} } from "@copyui/${slug}";\n\nexport function Example() {\n  return <${name} />;\n}`,
    examples: copy?.examples ?? [],
    relatedTitle: copy?.relatedTitle ?? "Related",
    keyboard: keyboardFor(slug, title, category),
    accessibility: copy?.accessibility ?? [
      `${title} keeps a native focus target, a visible focus ring and a readable label.`,
      "State changes are announced through the shared polite live region.",
      "Colour is paired with text or an icon, so meaning never depends on colour alone.",
    ],
    motion: copy?.motion ?? [
      `${title} uses the shared 120ms hover, 180ms state and 280ms indicator timings.`,
      "Transforms and non-essential transitions collapse under prefers-reduced-motion.",
      "The settled state is legible before the entrance animation begins.",
    ],
    responsive: copy?.responsive ?? [
      `${title} fills its container and keeps the 13px interface scale at every breakpoint.`,
      "Long labels truncate or wrap without widening the page.",
      "Menus and tooltips stay inside the viewport and remain reachable by touch.",
    ],
  };
}
