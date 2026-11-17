"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-tl {
  --ui-tl-size: 30px;
  --ui-tl-fs: var(--text-base);
  --ui-tl-pad: 0 11px 0 9px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--ui-tl-size);
  padding: var(--ui-tl-pad);
  border-radius: var(--ui-r-pill);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow);
  color: var(--ui-ink-soft);
  font-size: var(--ui-tl-fs);
  font-weight: var(--weight-medium);
  letter-spacing: -0.006em;
  max-width: 100%;
}
.ui-tl[data-size="sm"] { --ui-tl-size: 24px; --ui-tl-fs: var(--text-sm); --ui-tl-pad: 0 8px 0 7px; gap: 6px; }
.ui-tl[data-variant="plain"] {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  padding-left: 2px;
  padding-right: 2px;
}

.ui-tl__spinner,
.ui-tl__done {
  position: relative;
  width: 14px;
  height: 14px;
  flex: none;
  display: grid;
  place-items: center;
  color: var(--ui-accent);
}
.ui-tl__rays { position: relative; width: 14px; height: 14px; }
.ui-tl__ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.6px;
  height: 3.6px;
  border-radius: 1px;
  background: currentColor;
  transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-4.6px);
  opacity: 0.28;
  animation: ui-tl-ray 1s linear infinite;
  animation-delay: calc(var(--i) * -0.125s);
}
@keyframes ui-tl-ray {
  0%, 100% { opacity: 0.22; }
  45% { opacity: 1; }
}

.ui-tl__done svg { width: 14px; height: 14px; }
.ui-tl__done path {
  stroke: currentColor;
  stroke-width: 1.7;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 18;
  stroke-dashoffset: 18;
  animation: ui-tl-check 320ms var(--ui-ease) forwards;
}
@keyframes ui-tl-check { to { stroke-dashoffset: 0; } }

.ui-tl__label {
  position: relative;
  display: inline-block;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: ui-tl-roll 260ms var(--ui-ease);
}
@keyframes ui-tl-roll {
  from { opacity: 0; filter: blur(2px); transform: translateY(5px); }
  to { opacity: 1; filter: none; transform: none; }
}

.ui-tl[data-loading="true"] .ui-tl__label {
  background-image: linear-gradient(
    100deg,
    var(--ui-ink-soft) 25%,
    color-mix(in oklab, var(--ui-ink-soft) 35%, transparent) 45%,
    var(--ui-ink-soft) 65%
  );
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ui-tl-sheen 1.5s linear infinite;
}
@keyframes ui-tl-sheen {
  from { background-position: 120% 0; }
  to { background-position: -90% 0; }
}

.ui-tl[data-done="true"] { color: var(--ui-ok); }
.ui-tl[data-done="true"] .ui-tl__done { color: var(--ui-ok); }
.ui-tl[data-done="true"] .ui-tl__label { animation: ui-tl-settle 260ms var(--ui-ease); }
@keyframes ui-tl-settle {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-tl__ray { animation: none; opacity: 0.7; }
  .ui-tl__label,
  .ui-tl[data-loading="true"] .ui-tl__label { animation: none; }
  .ui-tl__done path { animation: none; stroke-dashoffset: 0; }
}
`;

injectCss("ui-thinking-loader", CSS);

export interface ThinkingLoaderProps {
  phases?: string[];
  interval?: number;
  phase?: number;
  loop?: boolean;
  done?: boolean;
  doneLabel?: string | ((seconds: number) => string);
  size?: "sm" | "md";
  variant?: "pill" | "plain";
  className?: string;
  children?: ReactNode;
}

const DEFAULT_PHASES = ["Thinking", "Searching the web", "Reading sources", "Writing response"];

export function ThinkingLoader({
  phases = DEFAULT_PHASES,
  interval = 2200,
  phase,
  loop = false,
  done = false,
  doneLabel = (seconds) => `Thought for ${seconds}s`,
  size = "md",
  variant = "pill",
  className,
}: ThinkingLoaderProps) {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const started = useRef(Date.now());
  const controlled = typeof phase === "number";
  const safePhases = phases.length ? phases : DEFAULT_PHASES;
  const current = controlled ? Math.min(phase!, safePhases.length - 1) : index;

  useEffect(() => {
    if (controlled || done) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next < safePhases.length) return next;
        return loop ? 0 : prev;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [controlled, done, interval, loop, safePhases.length]);

  useEffect(() => {
    if (!done) {
      started.current = Date.now();
      setSeconds(0);
      return;
    }
    setSeconds(Math.max(1, Math.round((Date.now() - started.current) / 1000)));
  }, [done]);

  const label = done
    ? typeof doneLabel === "function"
      ? doneLabel(seconds)
      : doneLabel
    : (safePhases[current] ?? safePhases[0]!);

  return (
    <span
      className={cx("ui-tl", className)}
      data-size={size}
      data-variant={variant}
      data-done={done || undefined}
      data-loading={!done || undefined}
      role="status"
      aria-live="polite"
    >
      <span className="ui-tl__spinner" aria-hidden="true">
        {done ? (
          <span className="ui-tl__done">
            <svg viewBox="0 0 16 16">
              <path d="M3.4 8.5 6.4 11.4 12.7 4.9" />
            </svg>
          </span>
        ) : (
          <span className="ui-tl__rays">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="ui-tl__ray" style={{ ["--i" as string]: i }} />
            ))}
          </span>
        )}
      </span>
      <span className="ui-tl__label" key={label} aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
