import type { InputHTMLAttributes, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ui-field__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  letter-spacing: -0.004em;
}
.ui-field__optional { font-size: var(--text-xs); color: var(--ui-faint); font-weight: var(--weight-regular); }

.ui-field__wrap {
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
.ui-field__wrap:hover { border-color: color-mix(in oklab, var(--ui-line-strong) 70%, var(--ui-ink-muted)); }
.ui-field__wrap:focus-within {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.ui-field[data-invalid="true"] .ui-field__wrap { border-color: var(--ui-danger); }
.ui-field[data-invalid="true"] .ui-field__wrap:focus-within { box-shadow: 0 0 0 3px var(--ui-danger-bg); }

.ui-field__input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ui-ink);
  font-size: var(--text-base);
  line-height: 1.4;
  padding: 7px 0;
}
.ui-field__input::placeholder { color: var(--ui-faint); }
.ui-field__icon { color: var(--ui-muted); display: inline-flex; flex: none; }
.ui-field__affix { color: var(--ui-faint); font-size: var(--text-sm); flex: none; }
.ui-field__hint { font-size: var(--text-sm); color: var(--ui-muted); line-height: var(--leading-snug); }
.ui-field[data-invalid="true"] .ui-field__hint { color: var(--ui-danger); }
`;

injectCss("ui-field", CSS);

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | boolean;
  icon?: ReactNode;
  affix?: ReactNode;
  optional?: boolean;
  wrapClassName?: string;
}

export function Field({
  label,
  hint,
  error,
  icon,
  affix,
  optional,
  className,
  id,
  wrapClassName,
  ...rest
}: FieldProps) {
  const invalid = Boolean(error);
  const inputId = id ?? (typeof label === "string" ? `field-${label.toLowerCase().replace(/\W+/g, "-")}` : undefined);
  return (
    <div className={cx("ui-field", className)} data-invalid={invalid || undefined}>
      {label ? (
        <label className="ui-field__label" htmlFor={inputId}>
          <span>{label}</span>
          {optional ? <span className="ui-field__optional">Optional</span> : null}
        </label>
      ) : null}
      <div className={cx("ui-field__wrap", wrapClassName)}>
        {icon ? <span className="ui-field__icon">{icon}</span> : null}
        <input
          id={inputId}
          className="ui-field__input"
          aria-invalid={invalid || undefined}
          {...rest}
        />
        {affix ? <span className="ui-field__affix">{affix}</span> : null}
      </div>
      {hint ? <span className="ui-field__hint">{typeof error === "string" ? error : hint}</span> : null}
    </div>
  );
}
