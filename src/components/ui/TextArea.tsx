"use client";

import { useEffect, useId, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-textarea { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-textarea__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-textarea__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }
.ui-textarea__wrap {
  display: flex;
  padding: 9px 11px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line-strong);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-textarea__wrap:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-textarea__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-textarea[data-invalid="true"] .ui-textarea__wrap { border-color: var(--ui-danger); }
.ui-textarea[data-invalid="true"] .ui-textarea__wrap:focus-within { box-shadow: 0 0 0 3px var(--ui-danger-bg); }
.ui-textarea__input {
  width: 100%;
  min-height: 68px;
  resize: vertical;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.55;
}
.ui-textarea__input::placeholder { color: var(--ui-faint); }
.ui-textarea__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--ui-muted);
}
.ui-textarea__count { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--ui-faint); }
.ui-textarea[data-invalid="true"] .ui-textarea__meta { color: var(--ui-danger); }
`;

injectCss("ui-text-area", CSS);

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  optional?: boolean;
  showCount?: boolean;
  autoGrow?: boolean;
}

export function TextArea({
  label,
  hint,
  error,
  optional,
  showCount = false,
  autoGrow = false,
  className,
  id,
  value,
  defaultValue,
  maxLength,
  onChange,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const areaId = id ?? `textarea-${autoId}`;
  const hintId = `${areaId}-hint`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;
  const length = String(value ?? defaultValue ?? "").length;

  useEffect(() => {
    const node = ref.current;
    if (!autoGrow || !node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [autoGrow, value, defaultValue]);

  return (
    <div
      className={cx("ui-textarea", className)}
      data-invalid={invalid || undefined}
    >
      {label ? (
        <label className="ui-textarea__label" htmlFor={areaId}>
          <span>{label}</span>
          {optional ? <span className="ui-textarea__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className="ui-textarea__wrap">
        <textarea
          ref={ref}
          id={areaId}
          className="ui-textarea__input"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? hintId : undefined}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...rest}
        />
      </div>
      {message || (showCount && maxLength) ? (
        <span className="ui-textarea__meta" id={hintId}>
          <span>{message}</span>
          {showCount && maxLength ? (
            <span className="ui-textarea__count">
              {length}/{maxLength}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
