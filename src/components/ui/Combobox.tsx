"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-combo { display: flex; flex-direction: column; gap: 6px; min-width: 0; position: relative; }
.ui-combo__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-combo__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }
.ui-combo__wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line-strong);
  transition:
    border-color var(--ui-dur) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-combo__wrap:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-combo__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-combo[data-invalid="true"] .ui-combo__wrap { border-color: var(--ui-danger); }
.ui-combo__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.4;
  padding: 7px 0;
}
.ui-combo__input::placeholder { color: var(--ui-faint); }
.ui-combo__chevron { display: inline-flex; flex: none; color: var(--ui-muted); pointer-events: none; }
.ui-combo__list {
  position: absolute;
  z-index: var(--z-dropdown, 40);
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 232px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  box-shadow: var(--ui-shadow-pop);
  animation: ui-combo-in var(--ui-dur) var(--ui-ease);
}
@keyframes ui-combo-in {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: none; }
}
.ui-combo__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 8px;
  border-radius: var(--ui-r-sm);
  font-size: var(--text-base);
  color: var(--ui-ink);
  cursor: pointer;
}
.ui-combo__option[data-active="true"] { background: var(--ui-hover); }
.ui-combo__option[aria-selected="true"] { color: var(--ui-accent-ink); }
.ui-combo__option[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
.ui-combo__desc { font-size: var(--text-sm); color: var(--ui-muted); }
.ui-combo__empty { padding: 8px; font-size: var(--text-sm); color: var(--ui-muted); }
.ui-combo__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--ui-muted);
}
.ui-combo[data-invalid="true"] .ui-combo__meta { color: var(--ui-danger); }
@media (prefers-reduced-motion: reduce) {
  .ui-combo__list { animation: none; }
}
`;

injectCss("ui-combobox", CSS);

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  optional?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  defaultValue = null,
  onChange,
  label,
  hint,
  error,
  optional,
  placeholder = "Search…",
  emptyMessage = "No matches.",
  allowCustom = false,
  disabled,
  id,
  className,
}: ComboboxProps) {
  const autoId = useId();
  const inputId = id ?? `combobox-${autoId}`;
  const listId = `${inputId}-listbox`;
  const hintId = `${inputId}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = value !== undefined ? value : internal;
  const selectedOption = options.find((option) => option.value === selected) ?? null;
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
      )
    : options;
  const invalid = Boolean(error);
  const message = typeof error === "string" ? error : hint;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setActive((current) => Math.min(current, Math.max(0, filtered.length - 1)));
  }, [open, filtered.length]);

  const commit = (next: string | null) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    commit(option.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      if (!filtered.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + delta + filtered.length) % filtered.length);
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActive(0);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setActive(Math.max(0, filtered.length - 1));
      return;
    }
    if (event.key === "Enter" && open) {
      const option = filtered[active];
      if (option) {
        event.preventDefault();
        choose(option);
      } else if (allowCustom && query.trim()) {
        event.preventDefault();
        commit(query.trim());
        setQuery("");
        setOpen(false);
      }
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
    if (event.key === "Tab") setOpen(false);
  };

  const activeOption = open ? filtered[active] : undefined;

  return (
    <div className={cx("ui-combo", className)} data-invalid={invalid || undefined}>
      {label ? (
        <label className="ui-combo__label" htmlFor={inputId}>
          <span>{label}</span>
          {optional ? <span className="ui-combo__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className="ui-combo__wrap" ref={wrapRef}>
        <input
          ref={inputRef}
          id={inputId}
          className="ui-combo__input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeOption ? `${listId}-${activeOption.value}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? hintId : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={selectedOption && !open ? undefined : placeholder}
          value={open ? query : selectedOption?.label ?? ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onClick={() => {
            if (!open) {
              setQuery("");
              setOpen(true);
            }
          }}
          onBlur={(event) => {
            if (!wrapRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
          }}
        />
        <span className="ui-combo__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.75 6 7.75l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {open ? (
          <ul className="ui-combo__list" id={listId} role="listbox" aria-label={typeof label === "string" ? label : "Options"}>
            {filtered.length === 0 ? (
              <li className="ui-combo__empty" role="presentation">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={option.value === selected}
                  aria-disabled={option.disabled || undefined}
                  className="ui-combo__option"
                  data-active={index === active || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                >
                  <span>{option.label}</span>
                  {option.description ? <span className="ui-combo__desc">{option.description}</span> : null}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {message ? (
        <span className="ui-combo__meta" id={hintId}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
