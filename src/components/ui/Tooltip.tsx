"use client";

import { useId, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
}
.ui-tip__bubble {
  position: absolute;
  z-index: 60;
  left: 50%;
  bottom: calc(100% + 7px);
  transform: translate(-50%, 3px) scale(0.98);
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 260px;
  width: max-content;
  padding: 6px 9px;
  border-radius: var(--ui-r-sm);
  background: var(--ui-solid);
  color: var(--ui-on-solid);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: 1.35;
  letter-spacing: -0.002em;
  box-shadow: var(--ui-shadow-pop);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--ui-dur) var(--ui-ease),
    transform var(--ui-dur) var(--ui-ease);
}
.ui-tip__bubble::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--ui-solid);
}
.ui-tip[data-side="bottom"] .ui-tip__bubble {
  bottom: auto;
  top: calc(100% + 7px);
  transform: translate(-50%, -3px) scale(0.98);
}
.ui-tip[data-side="bottom"] .ui-tip__bubble::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: var(--ui-solid);
}
.ui-tip:hover > .ui-tip__bubble,
.ui-tip:focus-within > .ui-tip__bubble {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}
.ui-tip__kbd {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255,255,255,.14);
  color: inherit;
  font-size: 10px;
  line-height: 1.4;
}
`;

injectCss("ui-tooltip", CSS);

export interface TooltipProps {
  content: ReactNode;
  shortcut?: string;
  side?: "top" | "bottom";
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, shortcut, side = "top", children, className }: TooltipProps) {
  const id = useId();
  return (
    <span
      className={cx("ui-tip", className)}
      data-side={side}
      aria-describedby={id}
      tabIndex={-1}
    >
      {children}
      <span className="ui-tip__bubble" role="tooltip" id={id}>
        {content}
        {shortcut ? <span className="ui-tip__kbd">{shortcut}</span> : null}
      </span>
    </span>
  );
}
