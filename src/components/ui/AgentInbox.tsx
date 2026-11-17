"use client";

import { useMemo, useState } from "react";
import { injectCss } from "../../lib/css";
import { cx, formatDuration, formatMoney } from "../../lib/utils";
import { useInterval } from "../../lib/hooks";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { ChevronDownIcon, CheckIcon, PauseIcon, PlayIcon, RefreshIcon, XIcon } from "../../lib/icons";

const CSS = `
.ui-inbox {
  display: flex;
  flex-direction: column;
  border-radius: var(--ui-r-lg);
  border: 1px solid var(--ui-line);
  background: var(--ui-card);
  box-shadow: var(--ui-shadow);
  overflow: hidden;
  width: 100%;
}
.ui-inbox__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 12px 9px;
  flex-wrap: wrap;
}
.ui-inbox__title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  letter-spacing: -0.012em;
  color: var(--ui-ink);
  margin-right: auto;
}
.ui-inbox__live {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--text-2xs); color: var(--ui-ok); font-weight: var(--weight-medium);
}
.ui-inbox__live-dot {
  width: 5px; height: 5px; border-radius: 50%; background: currentColor;
  animation: ui-inbox-pulse 1.6s var(--ui-ease) infinite;
}
@keyframes ui-inbox-pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60% { box-shadow: 0 0 0 3px transparent; opacity: .6; }
}

.ui-inbox__tabs { display: flex; align-items: center; gap: 1px; padding: 0 8px 8px; }
.ui-inbox__tab {
  display: inline-flex; align-items: center; gap: 5px;
  height: 24px; padding: 0 8px; border-radius: var(--ui-r-pill);
  color: var(--ui-muted); font-size: var(--text-sm); font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear;
}
.ui-inbox__tab:hover { color: var(--ui-ink); background: var(--ui-hover); }
.ui-inbox__tab[aria-selected="true"] { background: var(--ui-fill); color: var(--ui-ink); }
.ui-inbox__tab:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }
.ui-inbox__tab-count {
  font-size: 10px; color: var(--ui-faint); font-variant-numeric: tabular-nums;
}
.ui-inbox__tab[aria-selected="true"] .ui-inbox__tab-count { color: var(--ui-muted); }

.ui-inbox__list { border-top: 1px solid var(--ui-line); }
.ui-inbox__row { border-bottom: 1px solid var(--ui-line); }
.ui-inbox__row:last-child { border-bottom: 0; }
.ui-inbox__row[data-open="true"] { background: var(--ui-wash); }

.ui-inbox__btn {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 11px;
  text-align: left;
  transition: background var(--ui-dur-fast) linear;
}
.ui-inbox__btn:hover { background: var(--ui-hover); }
.ui-inbox__btn:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: -2px; }

.ui-inbox__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--ui-faint); margin-left: 3px; }
.ui-inbox__dot[data-s="running"] { background: var(--ui-accent); animation: ui-inbox-pulse 1.6s var(--ui-ease) infinite; }
.ui-inbox__dot[data-s="waiting"] { background: var(--ui-warn); }
.ui-inbox__dot[data-s="done"] { background: var(--ui-ok); }
.ui-inbox__dot[data-s="failed"] { background: var(--ui-danger); }

.ui-inbox__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ui-inbox__task {
  font-size: var(--text-base); color: var(--ui-ink); font-weight: var(--weight-medium);
  letter-spacing: -0.008em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ui-inbox__meta { display: flex; align-items: center; gap: 5px; min-width: 0; }
.ui-inbox__agent { font-size: var(--text-xs); color: var(--ui-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-inbox__clock {
  font-size: var(--text-xs); color: var(--ui-faint);
  font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 3px;
}
.ui-inbox__chev { color: var(--ui-faint); transition: transform var(--ui-dur) var(--ui-ease); }
.ui-inbox__row[data-open="true"] .ui-inbox__chev { transform: rotate(180deg); }

.ui-inbox__panel {
  padding: 0 11px 11px 36px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  animation: ui-inbox-in 200ms var(--ui-ease);
}
@keyframes ui-inbox-in {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: none; }
}
.ui-inbox__steps { display: flex; flex-direction: column; gap: 0; }
.ui-inbox__step {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: var(--text-sm); color: var(--ui-muted);
  position: relative; padding-bottom: 9px;
}
.ui-inbox__step:last-child { padding-bottom: 0; }
.ui-inbox__step:not(:last-child)::before {
  content: ""; position: absolute; left: 4px; top: 11px; bottom: 0; width: 1px; background: var(--ui-line);
}
.ui-inbox__step-mark {
  width: 9px; height: 9px; border-radius: 50%; flex: none; margin-top: 3px;
  background: var(--ui-card); box-shadow: inset 0 0 0 1.5px var(--ui-line-strong);
  position: relative; z-index: 1;
}
.ui-inbox__step[data-done="true"] .ui-inbox__step-mark { background: var(--ui-ok); box-shadow: none; }
.ui-inbox__step[data-current="true"] .ui-inbox__step-mark { background: var(--ui-accent); box-shadow: 0 0 0 3px var(--ui-accent-soft); }
.ui-inbox__step[data-done="true"] { color: var(--ui-ink-soft); }

.ui-inbox__actions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.ui-inbox__action {
  display: inline-flex; align-items: center; gap: 4px;
  height: 25px; padding: 0 9px; border-radius: var(--ui-r-pill);
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  color: var(--ui-ink-soft); background: var(--ui-fill);
  transition: background var(--ui-dur-fast) linear, transform var(--ui-dur-fast) var(--ui-ease);
}
.ui-inbox__action:hover { background: var(--ui-fill-strong); }
.ui-inbox__action:active { transform: scale(0.97); }
.ui-inbox__action[data-kind="primary"] { background: var(--ui-solid); color: var(--ui-on-solid); }
.ui-inbox__action[data-kind="primary"]:hover { background: var(--solid-hover); }
.ui-inbox__action[data-kind="quiet"] { background: transparent; color: var(--ui-muted); }
.ui-inbox__action[data-kind="quiet"]:hover { background: var(--ui-hover); color: var(--ui-ink); }
.ui-inbox__empty { padding: 26px 12px; text-align: center; color: var(--ui-faint); font-size: var(--text-sm); }
.ui-inbox__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 11px; border-top: 1px solid var(--ui-line); background: var(--ui-wash);
  font-size: var(--text-xs); color: var(--ui-faint);
}

@media (prefers-reduced-motion: reduce) {
  .ui-inbox__live-dot,
  .ui-inbox__dot,
  .ui-inbox__dot[data-s="running"],
  .ui-inbox__panel { animation: none; }
}
`;

injectCss("ui-agent-inbox", CSS);

export type AgentTaskStatus = "running" | "waiting" | "done" | "failed";

export interface AgentTask {
  id: string;
  title: string;
  agent: string;
  status: AgentTaskStatus;
  elapsedMs: number;
  cost?: number;
  steps: string[];
  currentStep?: number;
}

export type InboxFilter = "all" | "needs" | "running" | "done";

export interface AgentInboxProps {
  tasks: AgentTask[];
  title?: string;
  defaultFilter?: InboxFilter;
  onAction?: (task: AgentTask, action: "approve" | "reject" | "retry" | "pause" | "resume" | "open") => void;
  className?: string;
  footer?: string;
}

const FILTERS: Array<{ value: InboxFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs", label: "Needs you" },
  { value: "running", label: "Running" },
  { value: "done", label: "Done" },
];

export function AgentInbox({
  tasks,
  title = "Agent inbox",
  defaultFilter = "all",
  onAction,
  className,
  footer = "Live · updates as agents work",
}: AgentInboxProps) {
  const [filter, setFilter] = useState<InboxFilter>(defaultFilter);
  const [openId, setOpenId] = useState<string | null>(tasks[0]?.id ?? null);
  const [tick, setTick] = useState(0);

  const anyRunning = tasks.some((task) => task.status === "running");
  useInterval(() => setTick((prev) => prev + 1), anyRunning ? 1000 : null);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      needs: tasks.filter((task) => task.status === "waiting" || task.status === "failed").length,
      running: tasks.filter((task) => task.status === "running").length,
      done: tasks.filter((task) => task.status === "done").length,
    }),
    [tasks],
  );

  const visible = tasks.filter((task) => {
    if (filter === "needs") return task.status === "waiting" || task.status === "failed";
    if (filter === "running") return task.status === "running";
    if (filter === "done") return task.status === "done";
    return true;
  });

  return (
    <div className={cx("ui-inbox", className)}>
      <div className="ui-inbox__head">
        <span className="ui-inbox__title">
          {title}
          {anyRunning ? (
            <span className="ui-inbox__live">
              <span className="ui-inbox__live-dot" aria-hidden="true" />
              live
            </span>
          ) : null}
        </span>
        <span className="ui-inbox__clock">{counts.needs ? `${counts.needs} need you` : "All clear"}</span>
      </div>

      <div className="ui-inbox__tabs" role="tablist" aria-label="Filter tasks">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className="ui-inbox__tab"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            <span className="ui-inbox__tab-count">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      <div className="ui-inbox__list">
        {visible.length ? (
          visible.map((task) => {
            const open = openId === task.id;
            const elapsed = task.elapsedMs + (task.status === "running" ? tick * 1000 : 0);
            const label =
              task.status === "waiting"
                ? "Needs you"
                : task.status === "failed"
                  ? "Failed"
                  : task.status === "running"
                    ? "Running"
                    : "Done";
            return (
              <div className="ui-inbox__row" key={task.id} data-open={open || undefined}>
                <button
                  type="button"
                  className="ui-inbox__btn"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : task.id)}
                >
                  <span className="ui-inbox__dot" data-s={task.status} aria-hidden="true" />
                  <span className="ui-inbox__main">
                    <span className="ui-inbox__task">{task.title}</span>
                    <span className="ui-inbox__meta">
                      <Avatar name={task.agent} size={14} />
                      <span className="ui-inbox__agent">{task.agent}</span>
                    </span>
                  </span>
                  <Badge
                    size="sm"
                    tone={
                      task.status === "waiting"
                        ? "warn"
                        : task.status === "failed"
                          ? "danger"
                          : task.status === "done"
                            ? "ok"
                            : "accent"
                    }
                  >
                    {label}
                  </Badge>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="ui-inbox__clock">{formatDuration(elapsed)}</span>
                    <ChevronDownIcon size={13} className="ui-inbox__chev" />
                  </span>
                </button>

                {open ? (
                  <div className="ui-inbox__panel">
                    <div className="ui-inbox__steps">
                      {task.steps.map((step, index) => {
                        const done =
                          task.status === "done" || (task.currentStep !== undefined && index < task.currentStep);
                        const current =
                          task.status === "running" && task.currentStep !== undefined && index === task.currentStep;
                        return (
                          <div
                            className="ui-inbox__step"
                            key={step}
                            data-done={done || undefined}
                            data-current={current || undefined}
                          >
                            <span className="ui-inbox__step-mark" />
                            <span>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="ui-inbox__actions">
                      {task.status === "waiting" ? (
                        <>
                          <button
                            type="button"
                            className="ui-inbox__action"
                            data-kind="primary"
                            onClick={() => onAction?.(task, "approve")}
                          >
                            <CheckIcon size={12} />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="ui-inbox__action"
                            onClick={() => onAction?.(task, "reject")}
                          >
                            <XIcon size={12} />
                            Reject
                          </button>
                        </>
                      ) : null}
                      {task.status === "failed" ? (
                        <button
                          type="button"
                          className="ui-inbox__action"
                          data-kind="primary"
                          onClick={() => onAction?.(task, "retry")}
                        >
                          <RefreshIcon size={12} />
                          Retry
                        </button>
                      ) : null}
                      {task.status === "running" ? (
                        <button
                          type="button"
                          className="ui-inbox__action"
                          onClick={() => onAction?.(task, "pause")}
                        >
                          <PauseIcon size={12} />
                          Pause
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="ui-inbox__action"
                        data-kind="quiet"
                        onClick={() => onAction?.(task, "open")}
                      >
                        <PlayIcon size={12} />
                        Open run
                      </button>
                      {typeof task.cost === "number" ? (
                        <span className="ui-inbox__clock" style={{ marginLeft: "auto" }}>
                          {formatMoney(task.cost)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="ui-inbox__empty">Nothing here right now.</div>
        )}
      </div>

      <div className="ui-inbox__foot">
        <span>{footer}</span>
        <span>{counts.running} running · {counts.needs} need you</span>
      </div>
    </div>
  );
}
