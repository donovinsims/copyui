"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-check { display: flex; align-items: flex-start; gap: 9px; min-width: 0; }
.ui-check__control {
  position: relative;
  display: inline-flex;
  flex: none;
  margin-top: 1px;
}
.ui-check__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.ui-check__input:disabled { cursor: not-allowed; }
.ui-check__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: var(--ui-r-xs);
  border: 1px solid var(--ui-line-strong);
  background: var(--ui-card);
  color: var(--ui-on-solid);
  box-shadow: 0 1px 0 rgba(0,0,0,.02);
  transition:
    background var(--ui-dur-fast) var(--ui-ease),
    border-color var(--ui-dur-fast) var(--ui-ease),
    box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-check__box svg { opacity: 0; transform: scale(0.7); transition: opacity var(--ui-dur-fast) var(--ui-ease), transform var(--ui-dur) var(--ui-ease-pop); }
.ui-check__input:hover + .ui-check__box { border-color: color-mix(in oklab, var(--ui-line-strong) 60%, var(--ui-ink-muted)); }
.ui-check__input:checked + .ui-check__box,
.ui-check__input:indeterminate + .ui-check__box {
  background: var(--ui-solid);
  border-color: var(--ui-solid);
}
.ui-check__input:checked + .ui-check__box svg,
.ui-check__input:indeterminate + .ui-check__box svg { opacity: 1; transform: none; }
.ui-check__input:focus-visible + .ui-check__box {
  outline: 2px solid var(--ui-focus);
  outline-offset: 2px;
}
.ui-check__input:disabled + .ui-check__box { opacity: 0.45; }
.ui-check__box--dash svg { display: none; }
.ui-check__box--dash::after {
  content: "";
  width: 7px;
  height: 1.5px;
  border-radius: 1px;
  background: currentColor;
}
.ui-check__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ui-check__label { font-size: var(--text-base); color: var(--ui-ink); line-height: 1.35; cursor: pointer; }
.ui-check__input:disabled ~ .ui-check__text .ui-check__label { cursor: not-allowed; opacity: 0.55; }
.ui-check__desc { font-size: var(--text-sm); color: var(--ui-muted); line-height: var(--leading-snug); }
.ui-check[data-invalid="true"] .ui-check__box { border-color: var(--ui-danger); }
.ui-check__error { font-size: var(--text-sm); color: var(--ui-danger); }
`;

injectCss("ui-checkbox", CSS);

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  error?: string;
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  error,
  className,
  id,
  disabled,
  ...rest
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? `checkbox-${autoId}`;
  const descId = `${inputId}-desc`;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={cx("ui-check", className)} data-invalid={error ? true : undefined}>
      <span className="ui-check__control">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="ui-check__input"
          aria-describedby={description || error ? descId : undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          {...rest}
        />
        <span className={cx("ui-check__box", indeterminate && "ui-check__box--dash")} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.8 5.2 3.9 7.3 8.3 2.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {label || description || error ? (
        <span className="ui-check__text">
          {label ? (
            <label className="ui-check__label" htmlFor={inputId}>
              {label}
            </label>
          ) : null}
          {description ? (
            <span className="ui-check__desc" id={descId}>
              {description}
            </span>
          ) : null}
          {error ? (
            <span className="ui-check__error" id={description ? undefined : descId}>
              {error}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
