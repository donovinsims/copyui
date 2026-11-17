"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-tags { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-tags__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-tags__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }
.ui-tags__wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 5px 8px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line-strong);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-tags__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-tags[data-invalid="true"] .ui-tags__wrap { border-color: var(--ui-danger); }
.ui-tags[data-invalid="true"] .ui-tags__wrap:focus-within { box-shadow: 0 0 0 3px var(--ui-danger-bg); }

.ui-tags__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 4px 0 8px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill);
  color: var(--ui-ink);
  font-size: var(--text-sm);
  line-height: 1;
  max-width: 100%;
}
.ui-tags__tag-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-tags__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ui-muted);
  cursor: pointer;
  transition: background var(--ui-dur-fast) var(--ui-ease), color var(--ui-dur-fast) var(--ui-ease);
}
.ui-tags__remove:hover { background: var(--ui-fill-strong); color: var(--ui-ink); }
.ui-tags__remove:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }

.ui-tags__input {
  flex: 1;
  min-width: 96px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.4;
  padding: 3px 2px;
}
.ui-tags__input::placeholder { color: var(--ui-faint); }
.ui-tags__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--ui-muted);
}
.ui-tags__count { margin-left: auto; color: var(--ui-faint); font-variant-numeric: tabular-nums; }
.ui-tags[data-invalid="true"] .ui-tags__meta { color: var(--ui-danger); }
`;

injectCss("ui-tag-input", CSS);

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  optional?: boolean;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function TagInput({
  value,
  defaultValue = [],
  onChange,
  label,
  hint,
  error,
  optional,
  placeholder = "Add a tag…",
  max = 12,
  disabled,
  id,
  className,
}: TagInputProps) {
  const autoId = useId();
  const inputId = id ?? `tags-${autoId}`;
  const hintId = `${inputId}-hint`;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const tags = value ?? internal;
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;

  const update = (next: string[]) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const part of parts) {
      if (next.length >= max) break;
      if (!next.some((tag) => tag.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    if (next.length !== tags.length) update(next);
    setDraft("");
  };

  const remove = (index: number) => {
    update(tags.filter((_, position) => position !== index));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && tags.length) {
      event.preventDefault();
      remove(tags.length - 1);
    }
  };

  return (
    <div className={cx("ui-tags", className)} data-invalid={invalid || undefined}>
      {label ? (
        <label className="ui-tags__label" htmlFor={inputId}>
          <span>{label}</span>
          {optional ? <span className="ui-tags__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className="ui-tags__wrap">
        {tags.map((tag, index) => (
          <span className="ui-tags__tag" key={`${tag}-${index}`}>
            <span className="ui-tags__tag-text">{tag}</span>
            <button
              type="button"
              className="ui-tags__remove"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => remove(index)}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                <path d="M1.6 1.6 7.4 7.4M7.4 1.6 1.6 7.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={inputId}
          className="ui-tags__input"
          value={draft}
          placeholder={tags.length ? "" : placeholder}
          disabled={disabled || tags.length >= max}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? hintId : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (text.includes(",")) {
              event.preventDefault();
              add(text);
            }
          }}
        />
      </div>
      {message || tags.length ? (
        <span className="ui-tags__meta" id={hintId}>
          <span>{message ?? "Enter or comma adds a tag; Backspace removes the last one."}</span>
          <span className="ui-tags__count">
            {tags.length}/{max}
          </span>
        </span>
      ) : null}
    </div>
  );
}
