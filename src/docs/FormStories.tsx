"use client";

import { useState } from "react";
import { Specimen, Row, Col, DemoLabel, Snippet } from "./Specimen";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { Combobox, type ComboboxOption } from "../components/ui/Combobox";
import { Checkbox } from "../components/ui/Checkbox";
import { TagInput } from "../components/ui/TagInput";
import { OTPInput } from "../components/ui/OTPInput";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ReactionBar } from "../components/ui/ReactionBar";

const AGENTS: ComboboxOption[] = [
  { value: "claude", label: "Claude Sonnet", description: "Long context" },
  { value: "gpt", label: "GPT-6 Sol", description: "Fast tools" },
  { value: "local", label: "Local worker", description: "On device" },
  { value: "archived", label: "Archived agent", description: "Read only", disabled: true },
];

export function TextAreaSpecimen() {
  const [value, setValue] = useState("Summarise the call, then list every open question with an owner.");
  return (
    <Specimen
      id="spec-textarea"
      name="Text Area"
      note="Multi-line field with the same focus wash as a text field, an optional counter and an auto-growing variant."
      meta={["label", "counter", "auto-grow"]}
    >
      <Col gap={12}>
        <div style={{ width: "100%" }}>
          <TextArea
            label="Instructions"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            hint="Sent as the system prompt for this run."
            maxLength={180}
            showCount
          />
        </div>
        <div style={{ width: "100%" }}>
          <TextArea
            label="Plan"
            defaultValue={"1. Read the sources\n2. Draft the brief\n3. Ask before publishing"}
            autoGrow
            hint="Grows with the content; the page never jumps."
          />
        </div>
      </Col>
    </Specimen>
  );
}

export function SelectSpecimen() {
  const [value, setValue] = useState("auto");
  return (
    <Specimen
      id="spec-select"
      name="Select"
      note="A native select, styled to the system: the platform keeps type-ahead, keyboard support and the mobile picker."
      meta={["native", "label", "error", "placeholder"]}
    >
      <Col gap={12}>
        <div className="doc-grid doc-grid--2" style={{ width: "100%" }}>
          <Select
            label="Model"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            options={[
              { value: "auto", label: "Auto — pick per task" },
              { value: "sonnet", label: "Sonnet 5.5" },
              { value: "opus", label: "Opus 4.5" },
              { value: "sol", label: "GPT-6 Sol" },
            ]}
            hint="Auto routes by task type."
          />
          <Select
            label="Workspace"
            placeholder="Choose a workspace"
            options={[{ value: "research", label: "Research" }]}
            error="Pick a workspace before sending."
          />
        </div>
        <div style={{ width: "100%" }}>
          <Select label="Disabled" disabled options={[{ value: "one", label: "Locked by policy" }]} />
        </div>
      </Col>
    </Specimen>
  );
}

export function ComboboxPreview() {
  const [value, setValue] = useState<string | null>("claude");
  return <Combobox label="Assign to" value={value} onChange={setValue} options={AGENTS} />;
}

export function ComboboxSpecimen() {
  const [value, setValue] = useState<string | null>("claude");
  const [free, setFree] = useState<string | null>(null);
  return (
    <Specimen
      id="spec-combobox"
      name="Combobox"
      note="Filter as you type, arrow through the list and press Enter. Focus stays in the input; the active option is announced through aria-activedescendant."
      meta={["listbox", "keyboard", "free text"]}
    >
      <Col gap={12}>
        <div className="doc-grid doc-grid--2" style={{ width: "100%" }}>
          <Combobox label="Assign to" value={value} onChange={setValue} options={AGENTS} hint="Arrow keys, Home and End move; Escape closes." />
          <Combobox
            label="Custom tag"
            value={free}
            onChange={setFree}
            options={AGENTS}
            allowCustom
            placeholder="Type any agent name…"
            hint="Press Enter on free text to keep it."
          />
        </div>
        <DemoLabel>value: {value ?? "—"} · custom: {free ?? "—"}</DemoLabel>
      </Col>
    </Specimen>
  );
}

export function CheckboxSpecimen() {
  const [all, setAll] = useState(false);
  const [one, setOne] = useState(true);
  const [two, setTwo] = useState(false);
  return (
    <Specimen
      id="spec-checkbox"
      name="Checkbox"
      note="Native input, painted box: keyboard, form reset and screen readers behave as they should. The parent shows the mixed state when only some children are on."
      meta={["checked", "mixed", "description"]}
    >
      <Col gap={12}>
        <Checkbox
          checked={all}
          indeterminate={!all && (one || two)}
          onChange={(event) => {
            const next = event.target.checked;
            setAll(next);
            setOne(next);
            setTwo(next);
          }}
          label="Allow all tools"
          description="Applies to every agent in this workspace."
        />
        <Row gap={18} wrap>
          <Checkbox checked={one} onChange={(event) => setOne(event.target.checked)} label="Web search" />
          <Checkbox checked={two} onChange={(event) => setTwo(event.target.checked)} label="File access" />
        </Row>
        <Checkbox label="Require a reason" description="Blocked by your plan." disabled />
        <Checkbox label="Notify on failure" error="Choose at least one channel first." />
      </Col>
    </Specimen>
  );
}

export function TagInputPreview() {
  const [tags, setTags] = useState(["research", "customer-support"]);
  return <TagInput label="Tags" value={tags} onChange={setTags} max={5} />;
}

export function TagInputSpecimen() {
  const [tags, setTags] = useState(["research", "customer-support", "q4"]);
  return (
    <Specimen
      id="spec-tag-input"
      name="Tag Input"
      note="Enter or comma adds a tag; Backspace removes the last; each tag has its own labelled remove button. Duplicates are ignored."
      meta={["add", "remove", "max"]}
    >
      <Col gap={12}>
        <div className="doc-grid doc-grid--2" style={{ width: "100%" }}>
          <TagInput label="Tags" value={tags} onChange={setTags} max={8} hint="Used to route runs." />
          <TagInput label="Labels" defaultValue={["billing"]} max={3} error="Three labels is the maximum." />
        </div>
        <Snippet label="value">{JSON.stringify(tags)}</Snippet>
      </Col>
    </Specimen>
  );
}

export function OTPPreview() {
  const [code, setCode] = useState("204");
  return <OTPInput label="Verification code" value={code} onChange={setCode} hint="Six digits, pasted or typed." />;
}

export function OTPInputSpecimen() {
  const [code, setCode] = useState("");
  const [errorCode, setErrorCode] = useState("204815");
  return (
    <Specimen
      id="spec-otp"
      name="OTP Input"
      note="One box per character with paste, arrow keys, Backspace and one-time-code autofill. Each box is labelled “character n of six”."
      meta={["paste", "arrows", "autofill", "error"]}
    >
      <Col gap={14}>
        <OTPInput label="Verification code" value={code} onChange={setCode} onComplete={() => undefined} hint="Paste the whole code into any box." />
        <OTPInput label="Expired code" value={errorCode} onChange={setErrorCode} error="That code has expired. Send a new one." />
        <DemoLabel>value: {code || "—"}</DemoLabel>
      </Col>
    </Specimen>
  );
}

export function CodeBlockSpecimen() {
  return (
    <Specimen
      id="spec-code-block"
      name="Code Block"
      note="Vendored from the MIT-licensed affectui free component: a tray with the filename and copy button, line numbers that stay put while long lines scroll, highlighted lines and a built-in colorizer for TS, JS, JSON, Bash and Python."
      meta={["copy", "line numbers", "highlight", "wrap"]}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <CodeBlock
          code={`import { Agent } from "@copyui/agent";

export const agent = new Agent({
  model: "sonnet-5.5",
  tools: ["search", "read_file"],
  approval: "ask",
});`}
          language="ts"
          filename="agent.ts"
          highlightLines={[5]}
        />
      </div>
    </Specimen>
  );
}

export function ReactionBarSpecimen() {
  return (
    <Specimen
      id="spec-reaction-bar"
      name="Reaction Bar"
      note="Vendored from the MIT-licensed affectui free component: one pill for like, comment, repost and share. Tapping colours the icon, pops it and rolls the count while the pill glides to its new width."
      meta={["toggle", "counts", "pop", "reduced motion"]}
    >
      <ReactionBar
        reactions={{
          like: { count: 1284, active: true },
          comment: { count: 36 },
          repost: { count: 12 },
          share: { count: 4 },
        }}
      />
    </Specimen>
  );
}
