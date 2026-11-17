/**
 * The registry manifest: one entry per shipped component file in src/components/ui.
 * Titles, descriptions and categories live here so the generated registry stays a
 * build artifact, never hand-edited JSON.
 */
export const COMPONENTS = [
  { file: "AIAnswer", title: "AI Answer", category: "chat", description: "Streamed answer with source cards, inline citations, feedback and follow-up prompts." },
  { file: "AgentInbox", title: "Agent Inbox", category: "agent", description: "A queue of agent tasks with status, cost and the action each one needs." },
  { file: "ApprovalCard", title: "Approval Card", category: "agent", description: "The decision surface for an action an agent wants to take, with risk and a countdown." },
  { file: "Avatar", title: "Avatar", category: "surfaces", description: "Deterministic initials, status rings and a stack for overlapping people." },
  { file: "Badge", title: "Badge", category: "surfaces", description: "Tonal status chips that stay calm in a dense row." },
  { file: "BlurCrossfade", title: "Blur Crossfade", category: "motion", description: "Crossfades content through a short blur so a swap never reads as a jump." },
  { file: "Button", title: "Button", category: "inputs", description: "Pill button with primary, secondary, ghost and destructive variants, three sizes and a loading sweep." },
  { file: "Card", title: "Card", category: "surfaces", description: "One card anatomy: header, body and footer on a hairline surface." },
  { file: "ChatComposer", title: "Chat Composer", category: "chat", description: "Prompt composer with a model picker, attachments, folders, apps and approval mode." },
  { file: "Checkbox", title: "Checkbox", category: "inputs", description: "Native checkbox with a painted box, mixed state, description and error." },
  { file: "CodeBlock", title: "Code Block", category: "chat", description: "Code in a tray with filename, copy, line numbers, highlighted lines and a tiny colorizer." },
  { file: "Combobox", title: "Combobox", category: "inputs", description: "Filterable listbox with full keyboard support, aria-activedescendant and optional free text." },
  { file: "GradientText", title: "Gradient Text", category: "motion", description: "A slow accent gradient across a headline, collapsed under reduced motion." },
  { file: "GridBackground", title: "Grid Background", category: "motion", description: "A faint measured grid that fades out toward the edges of its container." },
  { file: "MessageActions", title: "Message Actions", category: "chat", description: "Copy, retry, rate and speak a message, with a settled confirmation." },
  { file: "Meter", title: "Meter", category: "surfaces", description: "Linear and ring measures with threshold tones and readable detail." },
  { file: "ModelPicker", title: "Model Picker", category: "agent", description: "Choose a model by speed, quality, cost and first-token time." },
  { file: "NumberTicker", title: "Number Ticker", category: "motion", description: "Counts a value up in view, once, with tabular digits and no layout shift." },
  { file: "OTPInput", title: "OTP Input", category: "inputs", description: "One box per character with paste, arrows, Backspace and one-time-code autofill." },
  { file: "ReactionBar", title: "Reaction Bar", category: "agent", description: "Like, comment, repost and share in one pill with rolling counts and a press pop." },
  { file: "SegmentedControl", title: "Segmented Control", category: "inputs", description: "A measured indicator that glides between segments, with roving tab focus." },
  { file: "Select", title: "Select", category: "inputs", description: "A native select styled to the system, keeping type-ahead and the mobile picker." },
  { file: "Shimmer", title: "Shimmer", category: "motion", description: "Skeleton placeholders and shimmering text for content that is still arriving." },
  { file: "Switch", title: "Switch", category: "inputs", description: "Spring thumb with a label and description inside one hit area." },
  { file: "TagInput", title: "Tag Input", category: "inputs", description: "Enter or comma adds a tag, Backspace removes the last, duplicates are ignored." },
  { file: "TextArea", title: "Text Area", category: "inputs", description: "Multi-line field with a counter, error text and an auto-growing variant." },
  { file: "TextField", title: "Text Field", category: "inputs", description: "Single-line field with label, hint, error, icon, affix and counter." },
  { file: "TextReveal", title: "Text Reveal", category: "motion", description: "Reveals a line word by word when it enters the viewport, once." },
  { file: "ThinkingLoader", title: "Thinking Loader", category: "chat", description: "A quiet working pill that rolls through phases and settles into a done state." },
  { file: "TiltCard", title: "Tilt Card", category: "motion", description: "A card that tilts toward the pointer within a small bound, disabled for touch and reduced motion." },
  { file: "ToolCallCard", title: "Tool Call Card", category: "agent", description: "One tool call: name, summary, live timer, arguments, result, error and retry." },
  { file: "Tooltip", title: "Tooltip", category: "surfaces", description: "A small dark bubble with an optional keyboard shortcut." },
];
