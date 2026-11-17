"use client";

import type { CSSProperties, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-badge {
  --ui-badge-bg: var(--ui-fill);
  --ui-badge-fg: var(--ui-ink-soft);
  --ui-badge-line: transparent;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  padding: 0 7px;
  border-radius: var(--ui-r-xs);
  border: 1px solid var(--ui-badge-line);
  background: var(--ui-badge-bg);
  color: var(--ui-badge-fg);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: 0.005em;
  line-height: 1;
  white-space: nowrap;
}
.ui-badge[data-size="sm"] { height: 17px; padding: 0 5px; font-size: var(--text-2xs); gap: 4px; border-radius: 5px; }
.ui-badge[data-pill="true"] { border-radius: var(--ui-r-pill); padding: 0 8px; }

.ui-badge[data-tone="neutral"] { --ui-badge-bg: var(--ui-fill); --ui-badge-fg: var(--ui-ink-muted); }
.ui-badge[data-tone="solid"] { --ui-badge-bg: var(--ui-solid); --ui-badge-fg: var(--ui-on-solid); }
.ui-badge[data-tone="brand"] { --ui-badge-bg: var(--ui-brand-bg); --ui-badge-fg: var(--ui-brand); }
.ui-badge[data-tone="accent"] { --ui-badge-bg: var(--ui-accent-soft); --ui-badge-fg: var(--ui-accent); }
.ui-badge[data-tone="ok"] { --ui-badge-bg: var(--ui-ok-bg); --ui-badge-fg: var(--ui-ok); }
.ui-badge[data-tone="warn"] { --ui-badge-bg: var(--ui-warn-bg); --ui-badge-fg: var(--ui-warn); }
.ui-badge[data-tone="danger"] { --ui-badge-bg: var(--ui-danger-bg); --ui-badge-fg: var(--ui-danger); }
.ui-badge[data-tone="outline"] { --ui-badge-bg: transparent; --ui-badge-fg: var(--ui-ink-soft); --ui-badge-line: var(--ui-line-strong); }

.ui-badge__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
.ui-badge[data-pulse="true"] .ui-badge__dot { animation: ui-badge-pulse 1.6s var(--ui-ease) infinite; }
@keyframes ui-badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60% { box-shadow: 0 0 0 3px transparent; opacity: .65; }
}
`;

injectCss("ui-badge", CSS);

export type BadgeTone =
  | "neutral"
  | "solid"
  | "brand"
  | "accent"
  | "ok"
  | "warn"
  | "danger"
  | "outline";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  pill?: boolean;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  title?: string;
  style?: CSSProperties;
}

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  pill,
  dot,
  pulse,
  className,
  title,
  style,
}: BadgeProps) {
  return (
    <span
      className={cx("ui-badge", className)}
      data-tone={tone}
      data-size={size}
      data-pill={pill || undefined}
      data-pulse={pulse || undefined}
      title={title}
      style={style}
    >
      {dot ? <span className="ui-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
