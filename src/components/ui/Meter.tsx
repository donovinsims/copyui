"use client";

import type { ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { clamp, cx } from "../../lib/utils";

const CSS = `
.ui-meter { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-meter__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--ui-ink-soft);
}
.ui-meter__label { font-weight: var(--weight-medium); }
.ui-meter__detail { color: var(--ui-muted); font-variant-numeric: tabular-nums; }
.ui-meter__track {
  position: relative;
  height: 5px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill);
  overflow: hidden;
}
.ui-meter__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--ui-solid);
  transition: width var(--ui-dur-morph) var(--ui-ease-morph), background var(--ui-dur) linear;
  background-image: linear-gradient(90deg, color-mix(in oklab, currentColor 0%, var(--ui-solid)), var(--ui-solid));
}
.ui-meter[data-tone="accent"] .ui-meter__fill { background: var(--ui-accent); }
.ui-meter[data-tone="ok"] .ui-meter__fill { background: var(--ui-ok); }
.ui-meter[data-tone="warn"] .ui-meter__fill { background: var(--ui-warn); }
.ui-meter[data-tone="danger"] .ui-meter__fill { background: var(--ui-danger); }
.ui-meter__fill[data-striped="true"] {
  background-image: linear-gradient(
    90deg,
    var(--ui-accent) 0 8px,
    color-mix(in oklab, var(--ui-accent) 55%, transparent) 8px 16px
  );
  background-size: 16px 100%;
}

.ui-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.ui-ring svg { transform: rotate(-90deg); overflow: visible; }
.ui-ring__track { stroke: var(--ui-fill); }
.ui-ring__value {
  stroke: var(--ui-accent);
  stroke-linecap: round;
  transition: stroke-dashoffset var(--ui-dur-morph) var(--ui-ease-morph), stroke var(--ui-dur) linear;
}
.ui-ring[data-tone="solid"] .ui-ring__value { stroke: var(--ui-solid); }
.ui-ring[data-tone="ok"] .ui-ring__value { stroke: var(--ui-ok); }
.ui-ring[data-tone="warn"] .ui-ring__value { stroke: var(--ui-warn); }
.ui-ring[data-tone="danger"] .ui-ring__value { stroke: var(--ui-danger); }
.ui-ring__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
`;

injectCss("ui-meter", CSS);

export type MeterTone = "solid" | "accent" | "ok" | "warn" | "danger";

export function Meter({
  value,
  label,
  detail,
  tone = "solid",
  striped,
  className,
}: {
  value: number;
  label?: ReactNode;
  detail?: ReactNode;
  tone?: MeterTone;
  striped?: boolean;
  className?: string;
}) {
  const pct = clamp(value, 0, 1) * 100;
  return (
    <div className={cx("ui-meter", className)} data-tone={tone}>
      {(label || detail) && (
        <div className="ui-meter__head">
          <span className="ui-meter__label">{label}</span>
          <span className="ui-meter__detail">{detail}</span>
        </div>
      )}
      <div
        className="ui-meter__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={typeof label === "string" ? label : undefined}
      >
        <span
          className="ui-meter__fill"
          data-striped={striped || undefined}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Ring({
  value,
  size = 44,
  stroke = 4,
  tone = "accent",
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: MeterTone;
  children?: ReactNode;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = clamp(value, 0, 1);
  return (
    <div
      className={cx("ui-ring", className)}
      data-tone={tone}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="ui-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ui-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      {children ? <span className="ui-ring__center">{children}</span> : null}
    </div>
  );
}
