import type { ButtonHTMLAttributes, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-btn {
  --ui-btn-h: 32px;
  --ui-btn-px: 13px;
  --ui-btn-fs: var(--text-base);
  --ui-btn-bg: transparent;
  --ui-btn-fg: var(--ui-ink);
  --ui-btn-line: transparent;
  --ui-btn-shadow: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--ui-btn-h);
  padding: 0 var(--ui-btn-px);
  border: 1px solid var(--ui-btn-line);
  border-radius: var(--ui-r-pill);
  background: var(--ui-btn-bg);
  color: var(--ui-btn-fg);
  box-shadow: var(--ui-btn-shadow);
  font-family: inherit;
  font-size: var(--ui-btn-fs);
  font-weight: var(--weight-medium);
  letter-spacing: -0.008em;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    background var(--ui-dur-fast) var(--ui-ease),
    color var(--ui-dur-fast) var(--ui-ease),
    border-color var(--ui-dur-fast) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease),
    transform var(--ui-dur-fast) var(--ui-ease),
    opacity var(--ui-dur-fast) linear;
}
.ui-btn[data-size="sm"] { --ui-btn-h: 26px; --ui-btn-px: 10px; --ui-btn-fs: var(--text-sm); gap: 5px; }
.ui-btn[data-size="lg"] { --ui-btn-h: 40px; --ui-btn-px: 18px; --ui-btn-fs: var(--text-md); gap: 7px; }

.ui-btn:hover { background: var(--ui-btn-hover, var(--ui-btn-bg)); }
.ui-btn:active { transform: scale(0.97); }
.ui-btn:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }

.ui-btn[data-variant="primary"] {
  --ui-btn-bg: var(--ui-solid);
  --ui-btn-hover: var(--solid-hover);
  --ui-btn-fg: var(--ui-on-solid);
  --ui-btn-shadow: var(--shadow-inset-top), 0 1px 2px rgba(0,0,0,.12);
}
.ui-btn[data-variant="secondary"] {
  --ui-btn-bg: var(--ui-fill);
  --ui-btn-hover: var(--ui-fill-strong);
  --ui-btn-fg: var(--ui-ink);
}
.ui-btn[data-variant="secondary"]:hover { border-color: var(--ui-line-strong); }
.ui-btn[data-variant="ghost"] {
  --ui-btn-bg: transparent;
  --ui-btn-hover: var(--ui-hover);
  --ui-btn-fg: var(--ui-ink-soft);
}
.ui-btn[data-variant="ghost"]:hover { --ui-btn-fg: var(--ui-ink); }
.ui-btn[data-variant="destructive"] {
  --ui-btn-bg: var(--ui-danger);
  --ui-btn-hover: color-mix(in oklab, var(--ui-danger) 88%, black);
  --ui-btn-fg: #fff;
  --ui-btn-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.14);
}

.ui-btn[data-full="true"] { width: 100%; }

.ui-btn[data-icon-only="true"] {
  --ui-btn-px: 0px;
  width: var(--ui-btn-h);
  flex: none;
}

.ui-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}

.ui-btn[data-loading="true"] { cursor: progress; }
.ui-btn[data-loading="true"] .ui-btn__label {
  background-image: linear-gradient(
    100deg,
    var(--ui-btn-fg) 20%,
    color-mix(in oklab, var(--ui-btn-fg) 45%, transparent) 42%,
    var(--ui-btn-fg) 64%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ui-btn-sweep 1.15s linear infinite;
}

@keyframes ui-btn-sweep {
  from { background-position: 130% 0; }
  to { background-position: -80% 0; }
}

.ui-btn__label {
  display: inline-flex;
  align-items: center;
  animation: ui-btn-in var(--ui-dur-slow) var(--ui-ease);
  will-change: filter, opacity, transform;
}
@keyframes ui-btn-in {
  from { opacity: 0; filter: blur(3px); transform: translateY(1px); }
  to { opacity: 1; filter: none; transform: none; }
}

.ui-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -1px;
  color: currentColor;
  opacity: 0.92;
}
.ui-btn__icon--right { margin-left: 0; margin-right: -1px; }

.ui-btn__spinner {
  width: 13px;
  height: 13px;
  flex: none;
  animation: ui-btn-rotate 720ms linear infinite;
}
.ui-btn__spinner circle {
  stroke: currentColor;
  stroke-width: 1.7;
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 14 22;
  opacity: 0.9;
}
@keyframes ui-btn-rotate { to { transform: rotate(360deg); } }

@media (pointer: coarse) {
  .ui-btn[data-size="sm"] { --ui-btn-h: 36px; }
  .ui-btn[data-size="md"] { --ui-btn-h: 40px; }
  .ui-btn[data-size="lg"] { --ui-btn-h: 46px; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-btn__label,
  .ui-btn[data-loading="true"] .ui-btn__label { animation: none; }
  .ui-btn__spinner { animation-duration: 2s; }
}
`;

injectCss("ui-button", CSS);

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}

function Spinner() {
  return (
    <svg className="ui-btn__spinner" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconOnly = !children && Boolean(icon || loading);
  const labelKey = typeof children === "string" ? children : undefined;

  return (
    <button
      type={type}
      className={cx("ui-btn", className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      data-icon-only={iconOnly || undefined}
      data-full={fullWidth || undefined}
      aria-busy={loading || undefined}
      disabled={disabled}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : icon ? (
        <span className="ui-btn__icon">{icon}</span>
      ) : null}
      {children ? (
        <span className="ui-btn__label" key={labelKey}>
          {children}
        </span>
      ) : null}
      {iconRight && !loading ? (
        <span className="ui-btn__icon ui-btn__icon--right">{iconRight}</span>
      ) : null}
    </button>
  );
}
