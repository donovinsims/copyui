"use client";

import { useEffect, useState } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { useInView, useReducedMotion } from "../../lib/hooks";

const CSS = `
.ui-nt { display: inline-flex; align-items: baseline; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.ui-nt__char { display: inline-flex; }
.ui-nt__digit {
  display: inline-block;
  height: 1em;
  overflow: hidden;
  line-height: 1em;
  vertical-align: bottom;
}
.ui-nt__strip {
  display: flex;
  flex-direction: column;
  transition: transform 900ms var(--ui-ease);
  will-change: transform;
}
.ui-nt__strip > span { height: 1em; line-height: 1em; display: block; text-align: center; }
.ui-nt__static { display: inline-block; }
.ui-nt__prefix, .ui-nt__suffix { color: inherit; }

@media (prefers-reduced-motion: reduce) {
  .ui-nt__strip { transition: none; }
}
`;

injectCss("ui-number-ticker", CSS);

export interface NumberTickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  startOnView?: boolean;
  grouping?: boolean;
}

function format(value: number, decimals: number, grouping: boolean): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  }).format(value);
}

export function NumberTicker({
  value,
  decimals = 0,
  prefix,
  suffix,
  className,
  startOnView = true,
  grouping = true,
}: NumberTickerProps) {
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const [shown, setShown] = useState(() => (startOnView ? 0 : value));

  useEffect(() => {
    if (startOnView && !seen) return;
    if (reduced) {
      setShown(value);
      return;
    }
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value, seen, startOnView, reduced]);

  const text = format(shown, decimals, grouping);

  return (
    <span className={cx("ui-nt", className)} ref={ref} aria-label={`${prefix ?? ""}${format(value, decimals, grouping)}${suffix ?? ""}`}>
      {prefix ? <span className="ui-nt__prefix" aria-hidden="true">{prefix}</span> : null}
      <span aria-hidden="true" style={{ display: "inline-flex" }}>
        {text.split("").map((char, index) =>
          /\d/.test(char) ? (
            <span className="ui-nt__char" key={`${index}-${char}`}>
              <span className="ui-nt__digit">
                <span
                  className="ui-nt__strip"
                  style={{
                    transform: `translateY(-${Number(char)}em)`,
                    transitionDelay: reduced ? "0ms" : `${index * 22}ms`,
                  }}
                >
                  {Array.from({ length: 10 }).map((_, digit) => (
                    <span key={digit}>{digit}</span>
                  ))}
                </span>
              </span>
            </span>
          ) : (
            <span className="ui-nt__static" key={`${index}-${char}`}>
              {char}
            </span>
          ),
        )}
      </span>
      {suffix ? <span className="ui-nt__suffix" aria-hidden="true">{suffix}</span> : null}
    </span>
  );
}
