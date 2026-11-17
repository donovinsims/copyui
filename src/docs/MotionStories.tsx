"use client";

import { useState } from "react";
import { Specimen, Row, Col, DemoLabel, Snippet } from "./Specimen";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardBody } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { NumberTicker } from "../components/ui/NumberTicker";
import { TextReveal } from "../components/ui/TextReveal";
import { Shimmer, ShimmerStack, ShimmerText } from "../components/ui/Shimmer";
import { TiltCard } from "../components/ui/TiltCard";
import { GradientText } from "../components/ui/GradientText";
import { GridBackground } from "../components/ui/GridBackground";
import { BlurCrossfade } from "../components/ui/BlurCrossfade";
import { Meter } from "../components/ui/Meter";
import { ArrowUpIcon, RefreshIcon, SparkleIcon } from "../lib/icons";

export function MotionPage() {
  return (
    <>
      <section className="page-hero">
        <span className="page-eyebrow">
          <span className="page-eyebrow-dot" />
          Motion · 7 effects
        </span>
        <h1 className="page-title">
          Movement that <em>explains</em>.
        </h1>
        <p className="page-lead">
          The original library ships motion as content effects, not decoration: digits roll, words
          arrive out of blur, skeletons share one sweep. All of it collapses under reduced motion.
        </p>
      </section>

      <TickerSpecimen />
      <RevealSpecimen />
      <ShimmerSpecimen />
      <TiltGradientSpecimen />
      <BackgroundSpecimen />
      <CrossfadeSpecimen />
    </>
  );
}

function TickerSpecimen() {
  const [value, setValue] = useState(1284);
  return (
    <Specimen
      name="Number ticker"
      note="Odometer digits: each column rolls independently with a 22ms stagger, and counts in from zero the first time it enters the viewport."
      meta={["odometer", "in-view", "aria-label"]}
    >
      <Row gap={22} align="baseline">
        <span className="ticker-demo">
          <NumberTicker value={value} prefix="$" />
        </span>
        <span className="ticker-demo ticker-demo--sm">
          <NumberTicker value={99.4} decimals={1} suffix="%" />
        </span>
        <span className="ticker-demo ticker-demo--sm">
          <NumberTicker value={42} suffix="s" grouping={false} />
        </span>
      </Row>
      <Row gap={5}>
        {[1284, 24_900, 62, 4800].map((next) => (
          <Button key={next} size="sm" variant={value === next ? "primary" : "secondary"} onClick={() => setValue(next)}>
            {next.toLocaleString("en-US")}
          </Button>
        ))}
      </Row>
      <Snippet>{`<NumberTicker value={revenue} prefix="$" />`}</Snippet>
    </Specimen>
  );
}

function RevealSpecimen() {
  const [run, setRun] = useState(0);
  return (
    <Specimen
      name="Text reveal"
      note="Words (or letters) rise out of a 4px blur with a stagger. Runs once on entry; replaying remounts the line."
      meta={["word", "letter"]}
      aside={
        <Button size="sm" variant="ghost" icon={<RefreshIcon size={12} />} onClick={() => setRun((prev) => prev + 1)}>
          Replay
        </Button>
      }
    >
      <h2 className="reveal-line" key={run}>
        <TextReveal split="word" stagger={55}>
          The quiet interface is the one that tells you what it is doing.
        </TextReveal>
      </h2>
      <span className="reveal-caption">
        <TextReveal split="letter" stagger={18} delay={200}>
          STATE, NOT SPECTACLE
        </TextReveal>
      </span>
    </Specimen>
  );
}

function ShimmerSpecimen() {
  const [loading, setLoading] = useState(true);
  return (
    <Specimen
      name="Shimmer loader"
      note="Skeleton blocks share one light sweep timed to the same curve as the text shimmer, so a loading page reads as a single object."
      meta={["blocks", "text", "shared sweep"]}
    >
      <div className="shimmer-demo">
        <Card style={{ width: 280 }}>
          <CardBody>
            {loading ? (
              <Col gap={10}>
                <Row gap={8}>
                  <Shimmer width={26} height={26} radius={999} />
                  <Col gap={5} style={{ flex: 1 }}>
                    <Shimmer width="52%" height={9} />
                    <Shimmer width="34%" height={8} />
                  </Col>
                </Row>
                <ShimmerStack lines={3} />
                <Row gap={6}>
                  <Shimmer width={58} height={22} radius={999} />
                  <Shimmer width={42} height={22} radius={999} />
                </Row>
              </Col>
            ) : (
              <Col gap={9}>
                <Row gap={8}>
                  <Avatar name="Research agent" size={26} />
                  <Col gap={2}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Research agent</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>5 sources · 42s</span>
                  </Col>
                  <Badge tone="ok" size="sm" dot style={{ marginLeft: "auto" }}>done</Badge>
                </Row>
                <p className="doc-hint">
                  Five pricing pages compared. Lisbon remains the best fit for the budget and dates.
                </p>
              </Col>
            )}
          </CardBody>
        </Card>

        <Col gap={8}>
          <ShimmerText>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Thinking…</span>
          </ShimmerText>
          <ShimmerText>
            <span style={{ fontSize: 13 }}>Reading 12 sources</span>
          </ShimmerText>
          <Button size="sm" variant="secondary" onClick={() => setLoading((prev) => !prev)}>
            {loading ? "Show loaded state" : "Show skeleton"}
          </Button>
        </Col>
      </div>
    </Specimen>
  );
}

function TiltGradientSpecimen() {
  return (
    <div className="doc-section">
      <div className="doc-section__head">
        <div className="doc-section__head-main">
          <h2 className="doc-section__title">Pointer and colour</h2>
          <p className="doc-section__lead">
            Two effects for landing pages: a card that leans toward the pointer, and text cut from a
            flowing gradient.
          </p>
        </div>
      </div>

      <div className="doc-grid doc-grid--2">
        <Specimen
          name="Tilt card"
          note="Max 7° of rotation, a 240px soft glare that follows the pointer, and a 520ms spring back on leave. Disabled for touch and reduced motion."
          meta={["3D", "glare"]}
        >
          <TiltCard max={8} style={{ maxWidth: 300 }}>
            <Card style={{ overflow: "hidden" }}>
              <CardBody>
                <Row gap={9}>
                  <Avatar name="Jonas Weber" size={38} />
                  <Col gap={2}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Jonas Weber</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Design lead · Berlin</span>
                  </Col>
                </Row>
                <div className="tilt-metrics">
                  <span><b>128</b> posts</span>
                  <span><b>2.4k</b> fans</span>
                  <span><b>18</b> runs</span>
                </div>
                <Meter value={0.64} label="Profile" detail="64%" tone="accent" />
                <Row gap={5}>
                  <Badge tone="ok" size="sm" dot>online</Badge>
                  <Badge tone="neutral" size="sm">agent-ready</Badge>
                </Row>
              </CardBody>
            </Card>
          </TiltCard>
        </Specimen>

        <Specimen
          name="Gradient text"
          note="A four-stop gradient sweeps across the word once when it enters view, then drifts slowly. The glyphs are cut from the gradient, not tinted."
          meta={["sweep", "drift"]}
        >
          <div className="gradient-demo">
            <GradientText>
              <span style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                Agents first.
              </span>
            </GradientText>
            <span className="doc-hint">
              Paired with <code>--accent</code> and <code>--accent-2</code>; it follows the accent
              swatches in the header.
            </span>
          </div>
          <Snippet>{`<GradientText>Agents first.</GradientText>`}</Snippet>
        </Specimen>
      </div>
    </div>
  );
}

function BackgroundSpecimen() {
  return (
    <Specimen
      name="Grid background"
      note="A 28px hairline grid drifting one cell every 32s, masked with a radial fade so it never fights the content."
      meta={["masked", "28px"]}
    >
      <GridBackground size={28} style={{ width: "100%", borderRadius: "var(--r-xl)" }}>
        <div className="grid-demo">
          <Badge tone="accent" dot pulse>live run</Badge>
          <h3 className="grid-demo__title">Everything the agent touches, in one field of view.</h3>
          <p className="doc-hint" style={{ maxWidth: 420 }}>
            Use it behind hero sections and empty states. The drift is slow enough to read as
            texture, not animation.
          </p>
          <Button size="sm" iconRight={<ArrowUpIcon size={13} />}>Open canvas</Button>
        </div>
      </GridBackground>
    </Specimen>
  );
}

const CROSSFADE_CONTENT = {
  a: {
    title: "Before approval",
    body: "The agent has prepared the email and is waiting. Nothing has been sent.",
    rows: 3,
  },
  b: {
    title: "After approval",
    body: "Sent to 42 customers. The receipt is written and the run is closed.",
    rows: 5,
  },
} as const;

function CrossfadeSpecimen() {
  const [view, setView] = useState<"a" | "b">("a");
  const content = CROSSFADE_CONTENT[view];
  return (
    <Specimen
      name="Blur crossfade"
      note="Swaps content with a 5px blur and moves the container to the next height on the morph curve — no jump, no layout shift."
      meta={["height morph", "380ms"]}
    >
      <Col gap={10} style={{ width: "100%", maxWidth: 400 }}>
        <SegmentedControl<"a" | "b">
          ariaLabel="Crossfade state"
          options={[
            { value: "a", label: "Before" },
            { value: "b", label: "After" },
          ]}
          value={view}
          onChange={setView}
        />
        <Card pad="lg">
          <BlurCrossfade contentKey={view}>
            <Col gap={7}>
              <Row gap={6}>
                <SparkleIcon size={14} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{content.title}</span>
                <Badge size="sm" tone={view === "a" ? "warn" : "ok"} style={{ marginLeft: "auto" }}>
                  {view === "a" ? "waiting" : "done"}
                </Badge>
              </Row>
              <p className="doc-hint">{content.body}</p>
              <Col gap={5}>
                {Array.from({ length: content.rows }).map((_, index) => (
                  <span key={index} className="crossfade-row">
                    <Shimmer width={12} height={12} radius={4} />
                    <span className="doc-hint" style={{ fontSize: 12 }}>
                      Step {index + 1} · {view === "a" ? "queued" : "complete"}
                    </span>
                  </span>
                ))}
              </Col>
            </Col>
          </BlurCrossfade>
        </Card>
        <DemoLabel>Toggle to morph the height</DemoLabel>
      </Col>
    </Specimen>
  );
}
