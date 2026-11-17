"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-otp { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-otp__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
}
.ui-otp__row { display: flex; align-items: center; gap: 6px; }
.ui-otp__cell {
  width: 38px;
  height: 42px;
  padding: 0;
  border-radius: var(--ui-r-md);
  border: 1px solid var(--ui-line-strong);
  background: var(--ui-card);
  color: var(--ui-ink);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  text-align: center;
  caret-color: var(--ui-accent);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease),
    background var(--ui-dur) var(--ui-ease);
}
.ui-otp__cell:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-otp__cell:focus {
  outline: none;
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-otp__cell:disabled { opacity: 0.5; }
.ui-otp__cell[aria-invalid="true"] { border-color: var(--ui-danger); }
.ui-otp[data-invalid="true"] .ui-otp__cell[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px var(--ui-danger-bg); }
.ui-otp__meta { font-size: var(--text-sm); color: var(--ui-muted); line-height: var(--leading-snug); }
.ui-otp[data-invalid="true"] .ui-otp__meta { color: var(--ui-danger); }
.ui-otp__sep { width: 6px; }
@media (max-width: 420px) {
  .ui-otp__cell { width: 34px; height: 38px; }
}
`;

injectCss("ui-otp-input", CSS);

export interface OTPInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  numeric?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  className?: string;
}

const only = (raw: string, numeric: boolean) =>
  numeric ? raw.replace(/\D/g, "") : raw.replace(/[^a-zA-Z0-9]/g, "");

export function OTPInput({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  label,
  hint,
  error,
  numeric = true,
  disabled,
  autoFocus = false,
  id,
  className,
}: OTPInputProps) {
  const autoId = useId();
  const groupId = id ?? `otp-${autoId}`;
  const hintId = `${groupId}-hint`;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [internal, setInternal] = useState(defaultValue);
  const raw = value ?? internal;
  const digits = Array.from({ length }, (_, index) => raw[index] ?? "");
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const apply = (next: string[]) => {
    const joined = next.join("");
    if (value === undefined) setInternal(joined);
    onChange?.(joined);
    if (next.every((entry) => entry !== "")) onComplete?.(joined);
  };

  const fillFrom = (start: number, text: string) => {
    const chars = only(text, numeric).split("");
    if (!chars.length) return;
    const next = [...digits];
    let cursor = start;
    for (const char of chars) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    apply(next);
    const focusAt = Math.min(cursor, length - 1);
    refs.current[focusAt]?.focus();
    refs.current[focusAt]?.select();
  };

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        apply(next);
        return;
      }
      if (index > 0) {
        next[index - 1] = "";
        apply(next);
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      refs.current[index - 1]?.select();
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
      refs.current[index + 1]?.select();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      refs.current[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      refs.current[length - 1]?.focus();
    }
  };

  const onPaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  };

  return (
    <div className={cx("ui-otp", className)} data-invalid={invalid || undefined}>
      {label ? (
        <span className="ui-otp__label" id={`${groupId}-label`}>
          {label}
        </span>
      ) : null}
      <div className="ui-otp__row" role="group" aria-labelledby={label ? `${groupId}-label` : undefined}>
        {digits.map((digit, index) => (
          <span key={index} style={{ display: "contents" }}>
            <input
              ref={(node) => {
                refs.current[index] = node;
              }}
              className="ui-otp__cell"
              value={digit}
              disabled={disabled}
              inputMode={numeric ? "numeric" : "text"}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Character ${index + 1} of ${length}`}
              aria-invalid={invalid || undefined}
              aria-describedby={message ? hintId : undefined}
              maxLength={1}
              onChange={(event) => {
                const text = only(event.target.value, numeric);
                if (!text) {
                  const next = [...digits];
                  next[index] = "";
                  apply(next);
                  return;
                }
                fillFrom(index, text);
              }}
              onKeyDown={onKeyDown(index)}
              onFocus={(event) => event.currentTarget.select()}
              onPaste={onPaste(index)}
            />
            {index === 2 && length > 4 && index < length - 1 ? (
              <span className="ui-otp__sep" aria-hidden="true" />
            ) : null}
          </span>
        ))}
      </div>
      {message ? (
        <span className="ui-otp__meta" id={hintId}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
