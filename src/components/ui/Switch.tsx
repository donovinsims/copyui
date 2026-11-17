"use client";

import type { ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-sw {
  --ui-sw-w: 30px;
  --ui-sw-h: 18px;
  --ui-sw-pad: 2px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--ui-ink);
  font-size: var(--text-base);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-radius: var(--ui-r-sm);
  text-align: left;
}
.ui-sw[data-size="sm"] { --ui-sw-w: 26px; --ui-sw-h: 16px; }
.ui-sw[data-size="lg"] { --ui-sw-w: 36px; --ui-sw-h: 21px; }
.ui-sw:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 3px; }
.ui-sw:disabled { opacity: 0.45; cursor: not-allowed; }

.ui-sw__track {
  position: relative;
  width: var(--ui-sw-w);
  height: var(--ui-sw-h);
  flex: none;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill-strong);
  box-shadow: inset 0 0 0 1px var(--ui-line);
  transition:
    background var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-sw__thumb {
  position: absolute;
  top: var(--ui-sw-pad);
  left: var(--ui-sw-pad);
  width: calc(var(--ui-sw-h) - var(--ui-sw-pad) * 2);
  height: calc(var(--ui-sw-h) - var(--ui-sw-pad) * 2);
  border-radius: 50%;
  background: var(--ui-card);
  box-shadow: 0 1px 2px rgba(0,0,0,.2), 0 0 0 0.5px rgba(0,0,0,.06);
  transition: transform var(--ui-dur-slow) var(--ui-ease-pop), background var(--ui-dur) var(--ui-ease);
}
.ui-sw[aria-checked="true"] .ui-sw__track {
  background: var(--ui-solid);
  box-shadow: inset 0 0 0 1px transparent;
}
.ui-sw[aria-checked="true"] .ui-sw__thumb {
  background: var(--ui-on-solid);
  transform: translateX(calc(var(--ui-sw-w) - var(--ui-sw-h)));
}
.ui-sw__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ui-sw__label { line-height: 1.3; }
.ui-sw__desc {
  font-size: var(--text-sm);
  color: var(--ui-muted);
  line-height: var(--leading-snug);
}
`;

injectCss("ui-switch", CSS);

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  size = "md",
  disabled,
  className,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      className={cx("ui-sw", className)}
      data-size={size}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-sw__track" aria-hidden="true">
        <span className="ui-sw__thumb" />
      </span>
      {label ? (
        <span className="ui-sw__text">
          <span className="ui-sw__label">{label}</span>
          {description ? <span className="ui-sw__desc">{description}</span> : null}
        </span>
      ) : null}
    </button>
  );
}
