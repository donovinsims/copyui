import { useEffect, useRef, useState, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { clamp, cx, formatClock } from "../../lib/utils";
import { AlertIcon, CheckIcon, ClockIcon, ShieldIcon, UndoIcon, XIcon } from "../../lib/icons";

const CSS = `
.ui-ap-wrap { display: flex; flex-direction: column; gap: 5px; width: 100%; }
.ui-ap__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: 0.01em;
  color: var(--ui-faint);
  padding-left: 2px;
}

.ui-ap {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--ui-r-lg);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow);
  overflow: hidden;
  transition: border-color var(--ui-dur) var(--ui-ease), box-shadow var(--ui-dur) var(--ui-ease);
}
.ui-ap:hover { box-shadow: var(--ui-shadow-pop); }
.ui-ap[data-status="pending"] { border-color: color-mix(in oklab, var(--ui-line) 60%, var(--ui-accent-line)); }

.ui-ap__head { display: flex; align-items: flex-start; gap: 10px; padding: 12px 13px 0; }
.ui-ap__icon {
  width: 30px; height: 30px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--ui-r-sm);
  background: var(--ui-fill);
  color: var(--ui-ink-soft);
}
.ui-ap[data-risk="high"] .ui-ap__icon { background: var(--ui-danger-bg); color: var(--ui-danger); }
.ui-ap[data-risk="medium"] .ui-ap__icon { background: var(--ui-warn-bg); color: var(--ui-warn); }
.ui-ap[data-risk="low"] .ui-ap__icon { background: var(--ui-ok-bg); color: var(--ui-ok); }

.ui-ap__titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ui-ap__title {
  display: flex; align-items: center; gap: 7px;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  letter-spacing: -0.01em;
  color: var(--ui-ink);
  line-height: 1.35;
}
.ui-ap__desc { font-size: var(--text-sm); color: var(--ui-muted); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ui-ap__risk {
  display: inline-flex; align-items: center; gap: 4px;
  height: 18px; padding: 0 6px; border-radius: var(--ui-r-pill);
  font-size: var(--text-2xs); font-weight: var(--weight-medium);
  background: var(--ui-fill); color: var(--ui-muted); flex: none;
}
.ui-ap[data-risk="high"] .ui-ap__risk { background: var(--ui-danger-bg); color: var(--ui-danger); }
.ui-ap[data-risk="medium"] .ui-ap__risk { background: var(--ui-warn-bg); color: var(--ui-warn); }
.ui-ap[data-risk="low"] .ui-ap__risk { background: var(--ui-ok-bg); color: var(--ui-ok); }

.ui-ap__preview {
  margin: 10px 13px 0;
  padding: 8px 10px;
  border-radius: var(--ui-r-sm);
  background: var(--ui-wash);
  border: 1px solid var(--ui-line);
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ui-ap__row { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.ui-ap__row-label { flex: none; width: 56px; font-size: var(--text-xs); color: var(--ui-faint); }
.ui-ap__row-value { font-size: var(--text-sm); color: var(--ui-ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ui-ap__tray {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 13px;
  margin-top: 11px;
  border-top: 1px solid var(--ui-line);
  background: var(--ui-wash);
  flex-wrap: wrap;
}
.ui-ap__check {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-sm); color: var(--ui-muted); cursor: pointer;
  user-select: none;
}
.ui-ap__box {
  width: 14px; height: 14px; flex: none;
  border-radius: 4px; border: 1px solid var(--ui-line-strong);
  background: var(--ui-card);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ui-on-solid);
  transition: background var(--ui-dur-fast) linear, border-color var(--ui-dur-fast) linear;
}
.ui-ap__box[data-on="true"] { background: var(--ui-solid); border-color: var(--ui-solid); }
.ui-ap__expiry {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--text-xs);
  color: var(--ui-faint);
  font-variant-numeric: tabular-nums;
}
.ui-ap__expiry[data-urgent="true"] { color: var(--ui-warn); }
.ui-ap__spacer { margin-left: auto; }
.ui-ap__actions { display: flex; align-items: center; gap: 5px; }

.ui-ap__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 28px; padding: 0 11px;
  border-radius: var(--ui-r-pill);
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  transition: background var(--ui-dur-fast) var(--ui-ease), color var(--ui-dur-fast) linear, transform var(--ui-dur-fast) var(--ui-ease), opacity var(--ui-dur) linear;
}
.ui-ap__btn:hover { background: var(--ui-hover); color: var(--ui-ink); }
.ui-ap__btn:active { transform: scale(0.97); }
.ui-ap__btn:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-ap__btn[data-variant="primary"] {
  background: var(--ui-solid); color: var(--ui-on-solid);
  box-shadow: var(--shadow-inset-top), 0 1px 2px rgba(0,0,0,.12);
}
.ui-ap__btn[data-variant="primary"]:hover { background: var(--solid-hover); }
.ui-ap__btn:disabled { opacity: 0.5; pointer-events: none; }
.ui-ap__kbd { display: inline-flex; gap: 2px; opacity: 0.7; }
.ui-ap__kbd kbd {
  font-family: var(--font-sans); font-size: 9px; line-height: 1;
  padding: 2px 3px; border-radius: 3px; background: rgba(255,255,255,.18);
}
.ui-ap__btn[data-variant="ghost"] .ui-ap__kbd kbd { background: var(--ui-fill); }

.ui-ap__spin { animation: ui-ap-spin 800ms linear infinite; }

.ui-ap__resolved {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 13px;
  animation: ui-ap-morph 380ms var(--ui-ease-morph);
}
@keyframes ui-ap-morph {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
.ui-ap__resolved-icon {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.ui-ap[data-status="approved"] .ui-ap__resolved-icon { background: var(--ui-ok-bg); color: var(--ui-ok); }
.ui-ap[data-status="denied"] .ui-ap__resolved-icon { background: var(--ui-fill); color: var(--ui-muted); }
.ui-ap__resolved-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ui-ap__resolved-title { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--ui-ink); }
.ui-ap__resolved-meta { font-size: var(--text-xs); color: var(--ui-faint); }
.ui-ap__resolved .ui-ap__spacer + * { flex: none; }

@media (max-width: 400px) {
  .ui-ap__tray { padding: 9px 11px; }
  .ui-ap__kbd { display: none; }
  .ui-ap__actions { width: 100%; }
  .ui-ap__actions .ui-ap__btn { flex: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ap__resolved { animation: none; }
}
`;

injectCss("ui-approval-card", CSS);

export type Risk = "low" | "medium" | "high";
export type ApprovalStatus = "pending" | "approved" | "denied";

export interface ApprovalDetail {
  label: string;
  value: ReactNode;
}

export interface ApprovalCardProps {
  title: string;
  description?: ReactNode;
  risk?: Risk;
  icon?: ReactNode;
  details?: ApprovalDetail[];
  preview?: ReactNode;
  children?: ReactNode;
  status?: ApprovalStatus;
  defaultStatus?: ApprovalStatus;
  onApprove?: (options: { always: boolean }) => void | Promise<void>;
  onDeny?: (options: { reason: "user" | "timeout" }) => void;
  onEdit?: () => void;
  expiresIn?: number;
  onExpire?: () => void;
  allowAlways?: boolean;
  alwaysLabel?: string;
  approveLabel?: string;
  denyLabel?: string;
  editLabel?: string;
  shortcuts?: boolean;
  label?: ReactNode;
  className?: string;
}

export function ApprovalCard({
  title,
  description,
  risk = "medium",
  icon,
  details = [],
  preview,
  children,
  status,
  defaultStatus = "pending",
  onApprove,
  onDeny,
  onEdit,
  expiresIn,
  onExpire,
  allowAlways = true,
  alwaysLabel = "Always allow this action",
  approveLabel = "Approve",
  denyLabel = "Deny",
  editLabel = "Edit",
  shortcuts = true,
  label,
  className,
}: ApprovalCardProps) {
  const [decision, setDecision] = useState<ApprovalStatus>(status ?? defaultStatus);
  const [always, setAlways] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(expiresIn ?? 0);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const card = useRef<HTMLDivElement | null>(null);

  const pending = decision === "pending";

  useEffect(() => {
    if (typeof status === "string") setDecision(status);
  }, [status]);

  useEffect(() => {
    setRemaining(expiresIn ?? 0);
  }, [expiresIn]);

  useEffect(() => {
    if (!pending || !expiresIn || paused) return;
    const id = window.setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearInterval(id);
  }, [pending, expiresIn, paused]);

  useEffect(() => {
    if (!pending || !expiresIn || remaining > 0) return;
    onExpire?.();
    onDeny?.({ reason: "timeout" });
    setDecision("denied");
    setNotice(`Expired: ${title}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const approve = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await onApprove?.({ always });
      setDecision("approved");
      setNotice(`Approved: ${title}`);
    } finally {
      setBusy(false);
    }
  };

  const deny = (reason: "user" | "timeout") => {
    if (!pending) return;
    onDeny?.({ reason });
    setDecision("denied");
    setNotice(reason === "timeout" ? `Expired: ${title}` : `Denied: ${title}`);
  };

  const reset = () => {
    setDecision("pending");
    setRemaining(expiresIn ?? 0);
    setNotice("");
    window.setTimeout(() => card.current?.focus(), 0);
  };

  const urgent = expiresIn ? remaining <= 10 : false;
  const riskWord = risk === "high" ? "High risk" : risk === "medium" ? "Medium risk" : "Low risk";
  const previewContent = preview ?? children;

  return (
    <div className={cx("ui-ap-wrap", className)}>
      {label ? <span className="ui-ap__label">{label}</span> : null}
      <div
        ref={card}
        className="ui-ap"
        data-risk={risk}
        data-status={decision}
        role="group"
        aria-labelledby={`ap-title-${title.replace(/\W+/g, "-")}`}
        aria-busy={busy || undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (!pending) return;
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void approve();
          } else if (event.key === "Escape") {
            event.preventDefault();
            deny("user");
          }
        }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={(event) => {
          // Pause for keyboard users reading the card, but not when Undo
          // programmatically focuses the container itself.
          if (event.target !== event.currentTarget) setPaused(true);
        }}
        onBlur={() => setPaused(false)}
      >
        {pending ? (
          <>
            <div className="ui-ap__head">
              <span className="ui-ap__icon" aria-hidden="true">
                {icon ?? <ShieldIcon size={15} />}
              </span>
              <div className="ui-ap__titles">
                <div className="ui-ap__title" id={`ap-title-${title.replace(/\W+/g, "-")}`}>
                  <span className="u-truncate">{title}</span>
                </div>
                {description ? <div className="ui-ap__desc">{description}</div> : null}
              </div>
              <span className="ui-ap__risk">
                {risk === "high" ? <AlertIcon size={10} /> : null}
                {riskWord}
              </span>
            </div>

            {previewContent ? <div className="ui-ap__preview">{previewContent}</div> : null}

            {details.length ? (
              <div className="ui-ap__preview" style={previewContent ? { marginTop: 6 } : undefined}>
                {details.map((detail) => (
                  <div className="ui-ap__row" key={detail.label}>
                    <span className="ui-ap__row-label">{detail.label}</span>
                    <span className="ui-ap__row-value">{detail.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="ui-ap__tray">
              {allowAlways ? (
                <label className="ui-ap__check">
                  <input
                    type="checkbox"
                    className="u-sr-only"
                    checked={always}
                    onChange={(event) => setAlways(event.target.checked)}
                  />
                  <span className="ui-ap__box" data-on={always || undefined} aria-hidden="true">
                    {always ? <CheckIcon size={10} /> : null}
                  </span>
                  <span className="u-truncate">{alwaysLabel}</span>
                </label>
              ) : null}

              <span className="ui-ap__spacer" />

              {expiresIn ? (
                <span className="ui-ap__expiry" data-urgent={urgent || undefined}>
                  <ClockIcon size={11} />
                  <span>Expires in {formatClock(remaining)}</span>
                </span>
              ) : null}

              <div className="ui-ap__actions">
                {onEdit ? (
                  <button type="button" className="ui-ap__btn" data-variant="ghost" onClick={onEdit}>
                    {editLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ui-ap__btn"
                  data-variant="ghost"
                  onClick={() => deny("user")}
                  aria-keyshortcuts="Escape"
                >
                  <span>{denyLabel}</span>
                  {shortcuts ? (
                    <span className="ui-ap__kbd" aria-hidden="true">
                      <kbd>esc</kbd>
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className="ui-ap__btn"
                  data-variant="primary"
                  onClick={() => void approve()}
                  disabled={busy}
                  aria-keyshortcuts="Meta+Enter Control+Enter"
                >
                  {busy ? (
                    <svg className="ui-ap__spin" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="9 20" />
                    </svg>
                  ) : null}
                  <span>{busy ? "Approving…" : approveLabel}</span>
                  {shortcuts && !busy ? (
                    <span className="ui-ap__kbd" aria-hidden="true">
                      <kbd>⌘</kbd>
                      <kbd>↵</kbd>
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="ui-ap__resolved">
            <span className="ui-ap__resolved-icon" aria-hidden="true">
              {decision === "approved" ? <CheckIcon size={12} /> : <XIcon size={12} />}
            </span>
            <span className="ui-ap__resolved-text">
              <span className="ui-ap__resolved-title">
                {decision === "approved" ? `Approved: ${title}` : `Denied: ${title}`}
              </span>
              <span className="ui-ap__resolved-meta">
                {decision === "approved"
                  ? always
                    ? "Approved · always allowed"
                    : "Approved · just now"
                  : remaining === 0 && expiresIn
                    ? "Denied · request expired"
                    : "Denied · just now"}
              </span>
            </span>
            <span className="ui-ap__spacer" />
            <button type="button" className="ui-ap__btn" data-variant="ghost" onClick={reset}>
              <UndoIcon size={13} />
              <span>Undo</span>
            </button>
          </div>
        )}
      </div>
      <span className="u-sr-only" role="status" aria-live="polite">
        {notice}
      </span>
      {expiresIn && pending ? (
        <span className="u-sr-only">
          Expires in {formatClock(clamp(remaining, 0, expiresIn))} seconds unless approved.
        </span>
      ) : null}
    </div>
  );
}
