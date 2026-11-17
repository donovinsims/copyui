"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-select { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-select__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-select__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }
.ui-select__wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line-strong);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-select__wrap:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-select__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-select[data-invalid="true"] .ui-select__wrap { border-color: var(--ui-danger); }
.ui-select[data-invalid="true"] .ui-select__wrap:focus-within { box-shadow: 0 0 0 3px var(--ui-danger-bg); }

.ui-select__field {
  appearance: none;
  width: 100%;
  min-height: 34px;
  padding: 6px 30px 6px 10px;
  border: 0;
  border-radius: inherit;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.4;
  cursor: pointer;
}
.ui-select__field:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-select__field option { background: var(--ui-card); color: var(--ui-ink); }
.ui-select__chevron {
  position: absolute;
  right: 10px;
  display: inline-flex;
  color: var(--ui-muted);
  pointer-events: none;
  transition: transform var(--ui-dur) var(--ui-ease);
}
.ui-select__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--ui-muted);
}
.ui-select[data-invalid="true"] .ui-select__meta { color: var(--ui-danger); }
`;

injectCss("ui-select", CSS);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  optional?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  hint,
  error,
  optional,
  options,
  placeholder,
  className,
  id,
  disabled,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? `select-${autoId}`;
  const hintId = `${selectId}-hint`;
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;

  return (
    <div className={cx("ui-select", className)} data-invalid={invalid || undefined}>
      {label ? (
        <label className="ui-select__label" htmlFor={selectId}>
          <span>{label}</span>
          {optional ? <span className="ui-select__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className="ui-select__wrap">
        <select
          id={selectId}
          className="ui-select__field"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? hintId : undefined}
          disabled={disabled}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="ui-select__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.75 6 7.75l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {message ? (
        <span className="ui-select__meta" id={hintId}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
