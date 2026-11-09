export interface DetailProp {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export interface DetailMeta {
  description: string;
  props: DetailProp[];
  variants: string[];
}

/**
 * Content for the shared component-detail template. Gallery inventory, previews
 * and navigation come from LIBRARY_ITEMS; this registry adds the API copy that
 * is specific to each component.
 */
export const DETAIL_META: Record<string, DetailMeta> = {
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
      { name: "placeholder", type: "string", defaultValue: '"Start by typing..."', description: "Prompt shown when the field is empty." },
      { name: "models", type: "ChatModel[]", defaultValue: "Auto, Claude, ChatGPT", description: "Models exposed by the picker." },
      { name: "defaultModelId", type: "string", defaultValue: "first model", description: "Initially selected model." },
      { name: "defaultFolder", type: "string | null", defaultValue: "null", description: "Working folder shown in the tray." },
      { name: "loadMs", type: "number", defaultValue: "1300", description: "How long dictation takes to resolve." },
      { name: "onSend", type: "(message, details) => void", description: "Called with the prompt and selected model." },
      { name: "onRequestApproval", type: "() => void", description: "Opens the approval request flow." },
      { name: "onAppsChange", type: "(connected) => void", description: "Called when an app connection changes." },
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

export function detailFor(slug: string, note: string): DetailMeta {
  return DETAIL_META[slug] ?? {
    description: note,
    props: [],
    variants: ["Default"],
  };
}
