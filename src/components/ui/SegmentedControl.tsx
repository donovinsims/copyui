"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-seg {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill);
  isolation: isolate;
  max-width: 100%;
}
.ui-seg[data-size="sm"] { padding: 2px; }
.ui-seg[data-variant="underline"] {
  border-radius: 0;
  background: transparent;
  padding: 0;
  gap: 0;
  border-bottom: 1px solid var(--ui-line);
  width: 100%;
}

.ui-seg__ind {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  width: 0;
  border-radius: var(--ui-r-pill);
  background: var(--ui-card);
  box-shadow: var(--ui-shadow), 0 1px 2px rgba(0,0,0,.05);
  transition:
    transform var(--ui-dur-slow) var(--ui-ease),
    width var(--ui-dur-slow) var(--ui-ease);
  will-change: transform, width;
  pointer-events: none;
  z-index: 0;
}
.ui-seg[data-size="sm"] .ui-seg__ind { top: 2px; bottom: 2px; }
.ui-seg[data-variant="underline"] .ui-seg__ind {
  top: auto;
  bottom: -1px;
  height: 1.5px;
  border-radius: 2px;
  background: var(--ui-ink);
  box-shadow: none;
}

.ui-seg__btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--ui-r-pill);
  color: var(--ui-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: -0.006em;
  white-space: nowrap;
  transition: color var(--ui-dur) var(--ui-ease), opacity var(--ui-dur) linear;
  flex: none;
}
.ui-seg[data-size="md"] .ui-seg__btn { height: 30px; padding: 0 13px; font-size: var(--text-base); }
.ui-seg[data-variant="underline"] .ui-seg__btn {
  flex: 1;
  height: 34px;
  border-radius: 0;
  padding: 0 10px;
}
.ui-seg__btn:hover { color: var(--ui-ink-soft); }
.ui-seg__btn[aria-selected="true"] { color: var(--ui-ink); }
.ui-seg[data-variant="underline"] .ui-seg__btn[aria-selected="true"] { color: var(--ui-ink); }
.ui-seg__btn:focus-visible {
  outline: 2px solid var(--ui-focus);
  outline-offset: 1px;
}
.ui-seg__btn svg { opacity: 0.85; }
.ui-seg__btn[aria-selected="true"] svg { opacity: 1; }

.ui-seg__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 15px;
  padding: 0 4px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill);
  color: var(--ui-muted);
  font-size: 10px;
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
}
.ui-seg__btn[aria-selected="true"] .ui-seg__count {
  background: var(--ui-accent-soft);
  color: var(--ui-accent);
}

.ui-seg__scroll {
  display: flex;
  align-items: center;
  gap: inherit;
  overflow-x: auto;
  scrollbar-width: none;
}
.ui-seg__scroll::-webkit-scrollbar { display: none; }
`;

injectCss("ui-seg", CSS);

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "pill" | "underline";
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  size = "md",
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const measure = useCallback(() => {
    const button = buttons.current[activeIndex];
    if (!button) return;
    setIndicator({ x: button.offsetLeft, width: button.offsetWidth });
  }, [activeIndex]);

  useLayoutEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(measure);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const button = buttons.current[activeIndex];
    if (button && trackRef.current?.contains(document.activeElement)) button.focus();
  }, [activeIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    let next = activeIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = activeIndex === last ? 0 : activeIndex + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = activeIndex === 0 ? last : activeIndex - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    const option = options[next];
    if (option) onChange(option.value);
  };

  return (
    <div
      ref={trackRef}
      className={cx("ui-seg", className)}
      data-variant={variant}
      data-size={size}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <span
        className="ui-seg__ind"
        aria-hidden="true"
        style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
      />
      <div className="ui-seg__scroll">
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={option.value === value}
            tabIndex={option.value === value ? 0 : -1}
            className="ui-seg__btn"
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
            {typeof option.count === "number" ? (
              <span className="ui-seg__count">{option.count}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
