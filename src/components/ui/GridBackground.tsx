"use client";

import type { CSSProperties, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-gridbg {
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  isolation: isolate;
}
.ui-gridbg__lines {
  position: absolute;
  inset: -40px;
  z-index: 0;
  background-image:
    linear-gradient(to right, var(--ui-grid-line, var(--hairline)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--ui-grid-line, var(--hairline)) 1px, transparent 1px);
  background-size: var(--ui-grid-size, 28px) var(--ui-grid-size, 28px);
  mask-image: radial-gradient(120% 100% at 50% 20%, #000 30%, transparent 78%);
  -webkit-mask-image: radial-gradient(120% 100% at 50% 20%, #000 30%, transparent 78%);
  animation: ui-gridbg-drift 32s linear infinite;
  opacity: var(--ui-grid-opacity, 1);
}
@keyframes ui-gridbg-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--ui-grid-size, 28px), var(--ui-grid-size, 28px), 0); }
}
.ui-gridbg__content { position: relative; z-index: 1; }

@media (prefers-reduced-motion: reduce) {
  .ui-gridbg__lines { animation: none; }
}
`;

injectCss("ui-grid-background", CSS);

export function GridBackground({
  children,
  size = 28,
  className,
  style,
}: {
  children?: ReactNode;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cx("ui-gridbg", className)}
      style={{ ["--ui-grid-size" as string]: `${size}px`, ...style }}
    >
      <span className="ui-gridbg__lines" aria-hidden="true" />
      {children ? <div className="ui-gridbg__content">{children}</div> : null}
    </div>
  );
}
