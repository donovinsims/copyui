import { useState } from "react";
import { Row, DemoLabel, Specimen } from "./Specimen";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ChatComposer } from "../components/ui/ChatComposer";
import { ThinkingLoader } from "../components/ui/ThinkingLoader";
import { GradientText } from "../components/ui/GradientText";
import { GridBackground } from "../components/ui/GridBackground";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { TOKENS, TOKEN_JSON, type TokenGroup } from "../data/tokens";
import {
  ArrowRightIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  LayersIcon,
  SparkleIcon,
  WandIcon,
} from "../lib/icons";

/* ------------------------------------------------------------------ overview */

export function OverviewPage({ onBrowse, onTokens }: { onBrowse: () => void; onTokens: () => void }) {
  const [lastMessage, setLastMessage] = useState("Send something to see the composer respond.");

  return (
    <>
      <section className="page-hero">
        <span className="page-eyebrow">
          <span className="page-eyebrow-dot" />
          Design system · clean-room
        </span>
        <h1 className="page-title">
          UI for agents, with the <GradientText>details done.</GradientText>
        </h1>
        <p className="page-lead">
          A measured recreation of the affectUI look and behaviour: Inter at 13px, hairline borders,
          pill controls, almost no colour — and an accent that only appears where meaning lives.
          Every piece is a single React file with its styles inside.
        </p>
        <div className="page-meta">
          <span className="page-stat"><b>24</b> components</span>
          <span className="page-stat"><b>54</b> tokens</span>
          <span className="page-stat"><b>7</b> motion effects</span>
          <span className="page-stat"><b>2</b> themes</span>
          <span className="page-stat"><b>0</b> runtime deps</span>
        </div>
        <Row gap={6}>
          <Button iconRight={<ArrowRightIcon size={14} />} onClick={onBrowse}>
            Browse components
          </Button>
          <Button variant="secondary" icon={<CodeIcon size={14} />} onClick={onTokens}>
            Read the tokens
          </Button>
        </Row>
      </section>

      <GridBackground size={26} style={{ borderRadius: "var(--r-2xl)" }}>
        <Card pad="lg" style={{ margin: 1 }}>
          <div className="overview-stage">
            <div className="overview-stage__copy">
              <DemoLabel>Live specimen</DemoLabel>
              <h2 className="overview-stage__title">A composer, a loader, an approval.</h2>
              <p className="doc-hint">
                The three shapes that carry almost every AI product. Notice what is missing: no
                gradients on the controls, no borders heavier than a hairline, no colour except the
                working accent.
              </p>
              <Row gap={6}>
                <ThinkingLoader size="sm" phases={["Thinking", "Reading sources", "Writing"]} interval={1900} />
                <Badge tone="neutral" dot>
                  calm by default
                </Badge>
              </Row>
            </div>
            <div className="overview-stage__demo">
              <ChatComposer
                loadMs={900}
                onSend={(message, details) => setLastMessage(`“${message}” → ${details.model}`)}
              />
              <span className="doc-hint" style={{ minHeight: 18 }}>
                {lastMessage}
              </span>
            </div>
          </div>
        </Card>
      </GridBackground>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">The four decisions that make it feel premium</h2>
            <p className="doc-section__lead">
              Reverse engineering the look is less about copying components and more about these
              constraints. Break one and the surface stops reading as affectUI.
            </p>
          </div>
        </div>
        <div className="doc-grid doc-grid--4">
          <div className="dna">
            <span className="dna__icon"><LayersIcon size={14} /></span>
            <span className="dna__title">Hairline over shadow</span>
            <span className="dna__text">
              Depth comes from a 1px line at 7% black and a 0.5px ring. Shadows are soft, short and
              never coloured.
            </span>
          </div>
          <div className="dna">
            <span className="dna__icon"><SparkleIcon size={14} /></span>
            <span className="dna__title">One accent, used sparingly</span>
            <span className="dna__text">
              Blue-violet marks work in progress, focus and citations. Everything else is ink and
              neutral fill.
            </span>
          </div>
          <div className="dna">
            <span className="dna__icon"><WandIcon size={14} /></span>
            <span className="dna__title">Motion with intent</span>
            <span className="dna__text">
              120ms for feedback, 180–280ms for surfaces, 380ms for a morph. One ease-out curve for
              almost everything.
            </span>
          </div>
          <div className="dna">
            <span className="dna__icon"><GridIconMark /></span>
            <span className="dna__title">Density that breathes</span>
            <span className="dna__text">
              13px base, 26–34px control heights, 8px rhythm. Information dense, never cramped.
            </span>
          </div>
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">The recipe</h2>
            <p className="doc-section__lead">Build it in this order and every new component inherits the look.</p>
          </div>
        </div>
        <div className="doc-grid doc-grid--2">
          <RecipeStep
            index="01"
            title="Measure, then normalise"
            text="Read computed styles from the live site, not its source: fonts, sizes, colours, radii, shadows, durations. Round every value into a scale."
          />
          <RecipeStep
            index="02"
            title="Name two layers of tokens"
            text="Editorial tokens (--bg, --text, --accent) for the page; semantic aliases (--ui-*) for components. Components only read --ui-*."
          />
          <RecipeStep
            index="03"
            title="Build primitives on the tokens"
            text="Button, Badge, Card, Field, Segmented, Switch, Avatar, Meter, Tooltip. These carry the interaction grammar."
          />
          <RecipeStep
            index="04"
            title="Compose domain surfaces"
            text="Composer, thinking loader, tool call, approval, inbox. They should need no new colours or shadows — only composition."
          />
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">What was measured</h2>
            <p className="doc-section__lead">
              Evidence from the rendered interface, then normalised. The original library is
              proprietary; this system is an independent implementation of the visible design.
            </p>
          </div>
        </div>
        <div className="doc-grid doc-grid--3">
          <MetricCard label="Body type" value="13px" detail="Inter, 400/500" />
          <MetricCard label="Display type" value="40/44" detail="500, −0.035em" />
          <MetricCard label="Canvas" value="#f5f5f5" detail="Cards #fff, panel #fcfcfc" />
          <MetricCard label="Hairline" value="7%" detail="rgba(0,0,0,.07)" />
          <MetricCard label="Radii" value="14 / 18" detail="cards / composer" />
          <MetricCard label="Ease" value=".22,1,.36,1" detail="180ms base" />
        </div>
      </section>
    </>
  );
}

function GridIconMark() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="2.4" y="2.4" width="4.6" height="4.6" rx="1.2" />
      <rect x="9" y="2.4" width="4.6" height="4.6" rx="1.2" />
      <rect x="2.4" y="9" width="4.6" height="4.6" rx="1.2" />
      <rect x="9" y="9" width="4.6" height="4.6" rx="1.2" />
    </svg>
  );
}

function RecipeStep({ index, title, text }: { index: string; title: string; text: string }) {
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

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="dna">
      <span className="doc-demolabel">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="dna__text">{detail}</span>
    </div>
  );
}

/* --------------------------------------------------------------- foundations */

const NEUTRALS = [
  ["--bg", "#f5f5f5", "App canvas"],
  ["--panel", "#fcfcfc", "Rails"],
  ["--card", "#ffffff", "Raised"],
  ["--preview", "#fafafa", "Inset demo"],
  ["--tray", "#f5f5f5", "Action tray"],
  ["--fill", "rgba(0,0,0,.055)", "Controls"],
] as const;

const STATUS = [
  ["--accent", "var(--accent)", "Work / focus"],
  ["--ok", "var(--ok)", "Done"],
  ["--warn", "var(--warn)", "Waiting"],
  ["--danger", "var(--danger)", "Error / deny"],
  ["--solid", "var(--solid)", "Primary"],
] as const;

const TYPE_ROWS = [
  ["Display", "40px / 44px", "500 · −0.035em", "UI for agents"],
  ["Heading", "26px / 32px", "500 · −0.024em", "What the agents did while you were away"],
  ["Subhead", "20px / 26px", "500 · −0.02em", "Approve, deny, or change it first"],
  ["Chat body", "14px / 1.62", "400 · −0.006em", "The offsite budget is €4,500 for three nights."],
  ["UI text", "13px / 1.5", "400 · −0.011em", "Request approval · Work in a folder"],
  ["Label", "11px / 1.3", "500 · +0.06em caps", "EXPIRES IN 0:42"],
  ["Mono", "12px / 1.55", "400", "gmail.send({ to: \"customers-eu\" })"],
] as const;

const SPACING = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64];

const RADII = [
  ["xs", 6, "Chips, keys"],
  ["sm", 8, "Inputs, trays"],
  ["md", 10, "Tool calls"],
  ["lg", 14, "Cards"],
  ["xl", 18, "Composer"],
  ["pill", 999, "Buttons"],
] as const;

const MOTION_ROWS = [
  ["--dur-fast", "120ms", "Hover and press feedback"],
  ["--dur", "180ms", "Menus, borders, colour"],
  ["--dur-slow", "280ms", "Segmented indicator, panels"],
  ["--dur-morph", "380ms", "Resolve rows, crossfades"],
  ["--ease", "cubic-bezier(.22,1,.36,1)", "Almost everything"],
  ["--ease-pop", "cubic-bezier(.34,1.5,.64,1)", "Switch thumb, badges"],
  ["--ease-morph", "cubic-bezier(.32,.72,0,1)", "Height and content morphs"],
] as const;

export function FoundationsPage({ accent }: { accent: { label: string; value: string; second: string } }) {
  const [radius, setRadius] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  return (
    <>
      <section className="page-hero">
        <span className="page-eyebrow">
          <span className="page-eyebrow-dot" />
          Foundations
        </span>
        <h1 className="page-title">
          The <em>rules</em> behind the surface.
        </h1>
        <p className="page-lead">
          Seven scales and one accent. Everything else in the system is composition. Use the
          controls above to confirm that changing a single variable re-skins the entire library.
        </p>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Colour</h2>
            <p className="doc-section__lead">
              A neutral ramp carries 95% of the interface. Colour is a signal, not decoration.
            </p>
          </div>
        </div>
        <h3 className="found-subhead">Neutrals</h3>
        <div className="swatch-row">
          {NEUTRALS.map(([name, value, note]) => (
            <div className="swatch" key={name}>
              <span className="swatch__chip" style={{ background: value }} />
              <span className="swatch__name">{note}</span>
              <span className="swatch__val">{name}</span>
            </div>
          ))}
        </div>

        <h3 className="found-subhead">Signal</h3>
        <div className="swatch-row">
          {STATUS.map(([name, value, note]) => (
            <div className="swatch" key={name}>
              <span className="swatch__chip" style={{ background: value }} />
              <span className="swatch__name">{note}</span>
              <span className="swatch__val">{name}</span>
            </div>
          ))}
        </div>

        <div className="found-note">
          <strong>Current accent:</strong> {accent.label} — <code>{accent.value}</code>, paired with{" "}
          <code>{accent.second}</code> for gradient text only. Status colours never change with the
          accent.
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Typography</h2>
            <p className="doc-section__lead">
              Inter with optical sizing. Weight 500 does the work of a bold, tracking tightens as
              size grows, and body copy sits at 13–14px.
            </p>
          </div>
        </div>
        <Card pad="lg">
          {TYPE_ROWS.map(([role, size, meta, sample]) => (
            <div className="type-row" key={role}>
              <span className="type-row__spec">
                <span className="type-row__meta">{role}</span>
                <span className="type-row__val">{size} · {meta}</span>
              </span>
              <span
                className="type-row__sample"
                style={{
                  fontSize: role === "Display" ? 34 : role === "Heading" ? 22 : role === "Subhead" ? 18 : role === "Chat body" ? 14 : role === "Label" ? 11 : 13,
                  fontWeight: role === "Display" || role === "Heading" || role === "Subhead" || role === "Label" ? 500 : 400,
                  letterSpacing: role === "Display" ? "-0.035em" : role === "Heading" ? "-0.024em" : role === "Label" ? "0.06em" : "-0.011em",
                  textTransform: role === "Label" ? "uppercase" : undefined,
                  fontFamily: role === "Mono" ? "var(--font-mono)" : undefined,
                }}
              >
                {sample}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Space, radius, elevation</h2>
            <p className="doc-section__lead">
              A 4px rhythm with a 2px micro-step. Radii scale from one multiplier, so a single
              slider re-softens the whole product.
            </p>
          </div>
        </div>

        <div className="doc-grid doc-grid--2">
          <Card pad="lg">
            <DemoLabel>Spacing</DemoLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
              {SPACING.map((step) => (
                <div className="space-row" key={step}>
                  <span className="space-label">{step}px</span>
                  <span className="space-bar" style={{ width: Math.min(step * 3.4, 220), height: Math.max(4, Math.min(step / 3, 12)) }} />
                  <code style={{ fontSize: 10, color: "var(--text-faint)" }}>--s-{step / 2}</code>
                </div>
              ))}
            </div>
          </Card>

          <Card pad="lg">
            <DemoLabel>Radii</DemoLabel>
            <Row gap={8} style={{ marginBottom: 10 }}>
              <input
                className="ds__range"
                style={{ width: 120 }}
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                aria-label="Preview radius"
              />
              <span className="ds__num">{Math.round(radius * 100)}%</span>
            </Row>
            <div className="doc-grid doc-grid--3" style={{ gap: 10 }}>
              {RADII.map(([name, px, note]) => (
                <div className="radius-tile" key={name}>
                  <span
                    className="radius-box"
                    style={{ borderRadius: px === 999 ? 999 : px * radius }}
                  />
                  <span className="swatch__name">{note}</span>
                  <span className="swatch__val">{name} · {px === 999 ? "999" : Math.round(px * radius)}px</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="doc-grid doc-grid--3">
          <Card pad="lg" style={{ boxShadow: "var(--shadow-card)" }}>
            <DemoLabel>Card</DemoLabel>
            <p className="doc-hint" style={{ marginTop: 6 }}>
              <strong>--shadow-card</strong><br />1px line + inset bottom.
            </p>
          </Card>
          <Card pad="lg" style={{ boxShadow: "var(--shadow-hairline)" }}>
            <DemoLabel>Hairline</DemoLabel>
            <p className="doc-hint" style={{ marginTop: 6 }}>
              <strong>--shadow-hairline</strong><br />0.5px ring + 1px drop.
            </p>
          </Card>
          <Card pad="lg" style={{ boxShadow: "var(--shadow-pop)" }}>
            <DemoLabel>Popover</DemoLabel>
            <p className="doc-hint" style={{ marginTop: 6 }}>
              <strong>--shadow-pop</strong><br />Wide, soft, 1px ring.
            </p>
          </Card>
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Motion</h2>
            <p className="doc-section__lead">
              Short, eased-out and honest about state. Nothing loops unless it is actually working.
            </p>
          </div>
        </div>
        <Card pad="lg">
          <div className="motion-table">
            <div className="motion-table__row motion-table__head">
              <span>Token</span>
              <span>Value</span>
              <span>Used for</span>
            </div>
            {MOTION_ROWS.map(([name, value, use]) => (
              <div className="motion-table__row" key={name}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{name}</span>
                <code>{value}</code>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{use}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="found-note">
          <strong>Reduced motion:</strong> the tokens collapse to 1ms in a{" "}
          <code>prefers-reduced-motion</code> block, and looping animations stop. State changes remain.
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Theme switch</h2>
            <p className="doc-section__lead">
              Dark mode is a variable swap on the same selectors — not a second stylesheet.
            </p>
          </div>
        </div>
        <Specimen
          name="data-theme"
          note={'Set data-theme="dark" on <html>, or use the class .dark. Components never branch on theme.'}
          meta={["CSS only"]}
        >
          <Row gap={6}>
            <SegmentedControl<"light" | "dark" | "system">
              ariaLabel="Preview theme"
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
              value={theme}
              onChange={setTheme}
            />
            <Badge tone="neutral">{theme}</Badge>
          </Row>
          <div className={theme === "dark" ? "theme-preview dark" : "theme-preview"}>
            <div className="theme-preview__head">
              <span className="ds__mark" style={{ width: 18, height: 18, fontSize: 10 }}>c</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Same card, two themes</span>
              <Badge size="sm" tone="ok" style={{ marginLeft: "auto" }}>live</Badge>
            </div>
            <div className="theme-preview__body">
              <span className="doc-hint">Only the variables changed. The structure, spacing and motion are identical.</span>
              <Row gap={5}>
                <Button size="sm">Approve</Button>
                <Button size="sm" variant="secondary">Deny</Button>
              </Row>
            </div>
          </div>
        </Specimen>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------- tokens */

const FILTERS: Array<{ value: TokenGroup | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "color", label: "Colour" },
  { value: "ink", label: "Ink" },
  { value: "line", label: "Lines" },
  { value: "space", label: "Space" },
  { value: "radius", label: "Radius" },
  { value: "shadow", label: "Shadow" },
  { value: "motion", label: "Motion" },
  { value: "type", label: "Type" },
];

export function TokensPage() {
  const [filter, setFilter] = useState<TokenGroup | "all">("all");
  const [copied, setCopied] = useState(false);
  const rows = TOKENS.filter((token) => filter === "all" || token.group === filter);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(TOKEN_JSON, null, 2));
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(TOKEN_JSON, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "copyui.tokens.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="page-hero">
        <span className="page-eyebrow">
          <span className="page-eyebrow-dot" />
          Reference
        </span>
        <h1 className="page-title">
          The <em>whole</em> system is 54 variables.
        </h1>
        <p className="page-lead">
          Two layers: editorial tokens that describe the page, and semantic <code>--ui-*</code>{" "}
          aliases that every component reads. Rebrand by overriding one layer, never the components.
        </p>
        <Row gap={6}>
          <Button size="sm" icon={copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />} onClick={() => void copy()}>
            {copied ? "Copied JSON" : "Copy tokens.json"}
          </Button>
          <Button size="sm" variant="secondary" onClick={download}>
            Download JSON
          </Button>
        </Row>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Rebrand in two blocks</h2>
            <p className="doc-section__lead">Put one selector in front so your values win regardless of stylesheet order.</p>
          </div>
        </div>
        <Card pad="none">
          <pre className="tokens-code">{`/* 1 · brand */
:root {
  --accent: #2f6bff;
  --accent-2: #5e3ee0;
  --radius-scale: 1;
}

/* 2 · dark */
:root[data-theme="dark"] {
  --bg: #08080a;
  --card: #151517;
  --accent: #6d97ff;
}`}</pre>
        </Card>
        <div className="found-note">
          Components read <code>--ui-card</code>, <code>--ui-line</code>, <code>--ui-ink</code>,{" "}
          <code>--ui-accent</code> and friends. Those alias the editorial tokens, so overriding
          <code> --accent</code> once updates every surface, ring and citation.
        </div>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Token catalogue</h2>
            <p className="doc-section__lead">Measured values, normalised. The live controls above override the first four colour tokens at runtime.</p>
          </div>
        </div>
        <Row gap={4}>
          {FILTERS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className="token-filter"
              aria-pressed={filter === entry.value}
              onClick={() => setFilter(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </Row>
        <Card pad="none">
          <div className="tokens-wrap">
            <table className="tokens">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((token) => (
                  <tr key={token.name}>
                    <td>{token.name}</td>
                    <td>{token.value}</td>
                    <td style={{ color: "var(--text-muted)" }}>{token.note}</td>
                    <td>
                      {token.swatch ? (
                        <span className="token-chip" style={{ background: token.swatch, display: "block" }} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="doc-section">
        <div className="doc-section__head">
          <div className="doc-section__head-main">
            <h2 className="doc-section__title">Accessibility contract</h2>
            <p className="doc-section__lead">Every component in the library follows these rules.</p>
          </div>
        </div>
        <div className="doc-grid doc-grid--2">
          <ListCard
            title="Focus"
            items={[
              "Visible rings via :focus-visible only",
              "2px ring at 55% accent, 2px offset",
              "Focus is never lost during async work",
            ]}
          />
          <ListCard
            title="Semantics"
            items={[
              "Native buttons and inputs first",
              "role=status + aria-live for agent state",
              "Shortcut hints are aria-hidden, bindings are real",
            ]}
          />
          <ListCard
            title="Motion"
            items={[
              "prefers-reduced-motion collapses durations",
              "Looping shimmer stops, state changes remain",
              "No parallax or scroll hijacking",
            ]}
          />
          <ListCard
            title="Contrast"
            items={[
              "Ink at 88% for primary text",
              "Muted at 61% for body, 45% for labels",
              "Colour never carries meaning alone",
            ]}
          />
        </div>
      </section>
    </>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dna">
      <span className="dna__title">{title}</span>
      <ul className="list-checks">
        {items.map((item) => (
          <li key={item}>
            <CheckIcon size={11} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
