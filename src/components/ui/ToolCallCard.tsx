"use client";

import { useState, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx, formatDuration } from "../../lib/utils";
import { useElapsed } from "../../lib/hooks";
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  RefreshIcon,
  SearchIcon,
  SparkleIcon,
} from "../../lib/icons";

const CSS = `
.ui-tc {
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  overflow: hidden;
  transition: border-color var(--ui-dur) var(--ui-ease), box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-tc:hover { border-color: var(--ui-line-strong); }
.ui-tc[data-open="true"] { box-shadow: var(--ui-shadow); }

.ui-tc__head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 9px;
  text-align: left;
  color: var(--ui-ink-soft);
}
.ui-tc__head:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: -2px; }
.ui-tc__name {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--ui-ink);
  letter-spacing: -0.02em;
  flex: none;
}
.ui-tc__summary {
  font-size: var(--text-sm);
  color: var(--ui-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.ui-tc__time {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--ui-faint);
  font-variant-numeric: tabular-nums;
  flex: none;
}
.ui-tc__chev { color: var(--ui-faint); transition: transform var(--ui-dur) var(--ui-ease); flex: none; }
.ui-tc[data-open="true"] .ui-tc__chev { transform: rotate(180deg); }

.ui-tc__status {
  width: 16px; height: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  flex: none; border-radius: 50%;
}
.ui-tc__status[data-status="done"] { background: var(--ui-ok-bg); color: var(--ui-ok); }
.ui-tc__status[data-status="error"] { background: var(--ui-danger-bg); color: var(--ui-danger); }
.ui-tc__status[data-status="running"] { color: var(--ui-accent); }
.ui-tc__spinner { width: 12px; height: 12px; animation: ui-tc-spin 820ms linear infinite; }
.ui-tc__spinner circle {
  fill: none; stroke: currentColor; stroke-width: 1.8;
  stroke-linecap: round; stroke-dasharray: 9 20;
}
@keyframes ui-tc-spin { to { transform: rotate(360deg); } }

.ui-tc__body {
  border-top: 1px solid var(--ui-line);
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--ui-wash);
  animation: ui-tc-in 180ms var(--ui-ease);
}
@keyframes ui-tc-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: none; }
}
.ui-tc__section { display: flex; flex-direction: column; gap: 4px; }
.ui-tc__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ui-tc__section-label {
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ui-faint);
}
.ui-tc__mini {
  display: inline-flex; align-items: center; gap: 4px;
  height: 20px; padding: 0 5px; border-radius: 5px;
  color: var(--ui-faint); font-size: var(--text-2xs); font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear;
}
.ui-tc__mini:hover { background: var(--ui-fill); color: var(--ui-ink-soft); }
.ui-tc__pre {
  margin: 0;
  padding: 8px 9px;
  border-radius: var(--ui-r-sm);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  color: var(--ui-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
  tab-size: 2;
  max-height: 190px;
  overflow-y: auto;
}
.ui-tc__key { color: var(--ui-accent); }
.ui-tc__str { color: var(--ui-ok); }
.ui-tc__num { color: var(--ui-warn); }
.ui-tc__bool { color: var(--ui-accent-2, var(--ui-accent)); }
.ui-tc__error {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 8px 9px; border-radius: var(--ui-r-sm);
  background: var(--ui-danger-bg); color: var(--ui-danger);
  font-size: var(--text-sm); line-height: 1.4;
}
`;

injectCss("ui-tool-call", CSS);

export type ToolStatus = "running" | "done" | "error";

export interface ToolCallCardProps {
  name: string;
  status?: ToolStatus;
  summary?: ReactNode;
  args?: Record<string, unknown>;
  result?: string;
  error?: string;
  durationMs?: number;
  defaultOpen?: boolean;
  onRetry?: () => void;
  className?: string;
  icon?: ReactNode;
}

function highlightJson(value: string): ReactNode[] {
  const pattern = /("(?:\\.|[^"\\])*")(\s*:)?|(\b-?\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(value))) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
    if (match[1]) {
      nodes.push(
        <span key={`k${key}`} className={match[2] ? "ui-tc__key" : "ui-tc__str"}>
          {match[1]}
        </span>,
      );
      if (match[2]) nodes.push(match[2]);
    } else if (match[3]) {
      nodes.push(
        <span key={`n${key}`} className="ui-tc__num">
          {match[3]}
        </span>,
      );
    } else if (match[4]) {
      nodes.push(
        <span key={`b${key}`} className="ui-tc__bool">
          {match[4]}
        </span>,
      );
    }
    cursor = match.index + match[0].length;
    key += 1;
  }
  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

export function ToolCallCard({
  name,
  status = "done",
  summary,
  args,
  result,
  error,
  durationMs = 0,
  defaultOpen = false,
  onRetry,
  className,
  icon,
}: ToolCallCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const elapsed = useElapsed(status === "running");
  const json = args ? JSON.stringify(args, null, 2) : "";
  const total = durationMs + elapsed;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result || json);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className={cx("ui-tc", className)} data-open={open || undefined}>
      <button
        type="button"
        className="ui-tc__head"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="ui-tc__status" data-status={status} aria-hidden="true">
          {status === "running" ? (
            <svg className="ui-tc__spinner" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" />
            </svg>
          ) : status === "done" ? (
            <CheckIcon size={11} />
          ) : (
            <AlertIcon size={11} />
          )}
        </span>
        {icon ?? <SearchIcon size={13} style={{ color: "var(--ui-faint)" }} />}
        <span className="ui-tc__name">{name}</span>
        {summary ? <span className="ui-tc__summary">{summary}</span> : null}
        <span className="ui-tc__time">
          {status === "running" ? formatDuration(total) : status === "error" ? "Failed" : formatDuration(total)}
        </span>
        <ChevronDownIcon size={13} className="ui-tc__chev" />
      </button>

      {open ? (
        <div className="ui-tc__body">
          {error ? (
            <div className="ui-tc__error">
              <AlertIcon size={13} />
              <span>{error}</span>
            </div>
          ) : null}

          {json ? (
            <div className="ui-tc__section">
              <div className="ui-tc__section-head">
                <span className="ui-tc__section-label">Arguments</span>
              </div>
              <pre className="ui-tc__pre">{highlightJson(json)}</pre>
            </div>
          ) : null}

          {result ? (
            <div className="ui-tc__section">
              <div className="ui-tc__section-head">
                <span className="ui-tc__section-label">Result</span>
                <button type="button" className="ui-tc__mini" onClick={() => void copy()}>
                  {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="ui-tc__pre">{result}</pre>
            </div>
          ) : null}

          {status === "error" && onRetry ? (
            <div className="ui-tc__section-head">
              <button type="button" className="ui-tc__mini" onClick={onRetry}>
                <RefreshIcon size={11} />
                <span>Retry call</span>
              </button>
            </div>
          ) : null}

          {status === "running" ? (
            <div className="ui-tc__section-head">
              <span className="ui-tc__section-label">
                <SparkleIcon size={10} style={{ display: "inline-block", marginRight: 4 }} />
                Waiting for the tool…
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
