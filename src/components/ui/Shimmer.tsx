"use client";

import type { CSSProperties, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-shimmer { position: relative; overflow: hidden; background: var(--ui-fill); border-radius: var(--ui-r-sm); }
.ui-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in oklab, var(--ui-card) 70%, transparent) 45%,
    transparent 90%
  );
  animation: ui-shimmer-sweep 1.6s var(--ui-ease) infinite;
}
:root[data-theme="dark"] .ui-shimmer::after,
.dark .ui-shimmer::after {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 45%, transparent 90%);
}
@keyframes ui-shimmer-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
.ui-shimmer-stack { display: flex; flex-direction: column; gap: 7px; }

.ui-shimmer-text {
  display: inline-block;
  background-image: linear-gradient(
    100deg,
    var(--ui-muted) 20%,
    color-mix(in oklab, var(--ui-muted) 25%, transparent) 45%,
    var(--ui-muted) 70%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ui-shimmer-text 1.8s linear infinite;
}
@keyframes ui-shimmer-text {
  from { background-position: 120% 0; }
  to { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-shimmer::after { animation: none; }
  .ui-shimmer-text {
    animation: none;
    background-image: none;
    color: var(--ui-muted);
    -webkit-text-fill-color: currentColor;
  }
}
`;

injectCss("ui-shimmer", CSS);

export function Shimmer({
  width,
  height = 10,
  radius,
  className,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cx("ui-shimmer", className)}
      style={{ width, height, borderRadius: radius, display: "block", ...style }}
      aria-hidden="true"
    />
  );
}

export function ShimmerStack({
  lines = 3,
  widths = ["100%", "92%", "64%"],
  height = 9,
}: {
  lines?: number;
  widths?: string[];
  height?: number;
}) {
  return (
    <span className="ui-shimmer-stack" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Shimmer key={index} height={height} width={widths[index % widths.length]} />
      ))}
    </span>
  );
}

export function ShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("ui-shimmer-text", className)}>{children}</span>;
}
