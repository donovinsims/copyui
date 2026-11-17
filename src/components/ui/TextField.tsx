"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-textfield { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-textfield__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-textfield__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }
.ui-textfield__wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line-strong);
  box-shadow: 0 1px 0 rgba(0,0,0,.02);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease),
    background var(--ui-dur) var(--ui-ease);
}
.ui-textfield__wrap:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-textfield__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-textfield[data-invalid="true"] .ui-textfield__wrap { border-color: var(--ui-danger); }
.ui-textfield[data-invalid="true"] .ui-textfield__wrap:focus-within { box-shadow: 0 0 0 3px var(--ui-danger-bg); }
.ui-textfield[data-disabled="true"] .ui-textfield__wrap { opacity: 0.55; background: var(--ui-sunken); }

.ui-textfield__input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.4;
  padding: 7px 0;
}
.ui-textfield__input::placeholder { color: var(--ui-faint); }
.ui-textfield__icon { color: var(--ui-muted); display: inline-flex; flex: none; }
.ui-textfield__affix { color: var(--ui-faint); font-size: var(--text-sm); flex: none; }
.ui-textfield__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--ui-muted);
}
.ui-textfield__count { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--ui-faint); }
.ui-textfield[data-invalid="true"] .ui-textfield__meta { color: var(--ui-danger); }
`;

injectCss("ui-text-field", CSS);

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  icon?: ReactNode;
  affix?: ReactNode;
  optional?: boolean;
  showCount?: boolean;
}

export function TextField({
  label,
  hint,
  error,
  icon,
  affix,
  optional,
  showCount = false,
  className,
  id,
  disabled,
  maxLength,
  value,
  defaultValue,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? `textfield-${autoId}`;
  const hintId = `${inputId}-hint`;
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;
  const length = String(value ?? defaultValue ?? "").length;

  return (
    <div
      className={cx("ui-textfield", className)}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {label ? (
        <label className="ui-textfield__label" htmlFor={inputId}>
          <span>{label}</span>
          {optional ? <span className="ui-textfield__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className="ui-textfield__wrap">
        {icon ? <span className="ui-textfield__icon">{icon}</span> : null}
        <input
          id={inputId}
          className="ui-textfield__input"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? hintId : undefined}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          {...rest}
        />
        {affix ? <span className="ui-textfield__affix">{affix}</span> : null}
      </div>
      {message || (showCount && maxLength) ? (
        <span className="ui-textfield__meta" id={hintId}>
          <span>{message}</span>
          {showCount && maxLength ? (
            <span className="ui-textfield__count">
              {length}/{maxLength}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
