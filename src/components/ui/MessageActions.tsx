import { useState } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { CheckIcon, CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon, VolumeIcon } from "../../lib/icons";

const CSS = `
.ui-ma { display: inline-flex; align-items: center; gap: 1px; color: var(--ui-muted); }
.ui-ma__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  height: 26px; min-width: 26px; padding: 0 6px;
  border-radius: var(--ui-r-pill);
  color: inherit; font-size: var(--text-xs); font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear, transform var(--ui-dur-fast) var(--ui-ease);
}
.ui-ma__btn:hover { background: var(--ui-hover); color: var(--ui-ink); }
.ui-ma__btn:active { transform: scale(0.94); }
.ui-ma__btn:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }
.ui-ma__btn[data-on="true"] { color: var(--ui-ok); }
.ui-ma__btn[data-good="true"] { color: var(--ui-ok); }
.ui-ma__btn[data-bad="true"] { color: var(--ui-danger); }
.ui-ma__btn[data-listening="true"] { color: var(--ui-accent); }
.ui-ma__label { font-size: var(--text-2xs); }
.ui-ma__spin { animation: ui-ma-spin 700ms linear infinite; }
@keyframes ui-ma-spin { to { transform: rotate(360deg); } }
.ui-ma__sep { width: 1px; height: 13px; background: var(--ui-line); margin: 0 3px; }

.ui-ma__eq { display: inline-flex; align-items: center; gap: 1.5px; height: 12px; }
.ui-ma__eq i {
  width: 2px; border-radius: 1px; background: currentColor;
  animation: ui-ma-eq 900ms var(--ui-ease) infinite;
}
.ui-ma__eq i:nth-child(1) { height: 4px; animation-delay: 0ms; }
.ui-ma__eq i:nth-child(2) { height: 9px; animation-delay: 120ms; }
.ui-ma__eq i:nth-child(3) { height: 6px; animation-delay: 60ms; }
.ui-ma__eq i:nth-child(4) { height: 10px; animation-delay: 180ms; }
.ui-ma__eq i:nth-child(5) { height: 5px; animation-delay: 90ms; }
@keyframes ui-ma-eq {
  0%, 100% { transform: scaleY(0.45); }
  50% { transform: scaleY(1); }
}

.ui-ma__versions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 132px;
  padding: 4px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow-pop);
  animation: ui-ma-in 150ms var(--ui-ease);
}
@keyframes ui-ma-in {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: none; }
}
.ui-ma__version {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; height: 24px; padding: 0 6px; border-radius: 5px;
  font-size: var(--text-xs); color: var(--ui-ink-soft); text-align: left;
}
.ui-ma__version:hover { background: var(--ui-hover); }
.ui-ma__version[aria-current="true"] { color: var(--ui-accent); }
.ui-ma__wrap { position: relative; display: inline-flex; }

@media (prefers-reduced-motion: reduce) {
  .ui-ma__eq i, .ui-ma__spin { animation: none; }
  .ui-ma__versions { animation: none; }
}
`;

injectCss("ui-message-actions", CSS);

export interface MessageActionsProps {
  text?: string;
  versions?: number;
  onCopy?: (text: string) => void;
  onRegenerate?: () => void;
  onFeedback?: (value: "up" | "down") => void;
  className?: string;
  labels?: boolean;
}

export function MessageActions({
  text = "",
  versions = 1,
  onCopy,
  onRegenerate,
  onFeedback,
  className,
  labels = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [spin, setSpin] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [listening, setListening] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [version, setVersion] = useState(versions);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    onCopy?.(text);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const regenerate = () => {
    setSpin(true);
    onRegenerate?.();
    window.setTimeout(() => {
      setSpin(false);
      setVersion((prev) => prev + 1);
      setShowVersions(true);
      window.setTimeout(() => setShowVersions(false), 3000);
    }, 650);
  };

  return (
    <div className={cx("ui-ma", className)}>
      <button
        type="button"
        className="ui-ma__btn"
        data-on={copied || undefined}
        aria-label={copied ? "Copied" : "Copy message"}
        onClick={() => void copy()}
      >
        {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
        {labels ? <span className="ui-ma__label">{copied ? "Copied" : "Copy"}</span> : null}
      </button>

      <span className="ui-ma__wrap">
        <button
          type="button"
          className="ui-ma__btn"
          aria-label="Regenerate"
          onClick={regenerate}
          aria-expanded={showVersions}
        >
          <RefreshIcon size={13} className={spin ? "ui-ma__spin" : undefined} />
          {labels ? <span className="ui-ma__label">Regenerate</span> : null}
        </button>
        {showVersions ? (
          <div className="ui-ma__versions" role="menu" aria-label="Versions">
            {Array.from({ length: version }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="menuitemradio"
                aria-checked={index === version - 1}
                aria-current={index === version - 1 ? "true" : undefined}
                className="ui-ma__version"
                onClick={() => {
                  setShowVersions(false);
                  setVersion(index + 1);
                }}
              >
                <span>Version {index + 1}</span>
                {index === version - 1 ? <CheckIcon size={11} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </span>

      <span className="ui-ma__sep" aria-hidden="true" />

      <button
        type="button"
        className="ui-ma__btn"
        data-good={feedback === "up" || undefined}
        aria-label="Good response"
        aria-pressed={feedback === "up"}
        onClick={() => {
          setFeedback("up");
          onFeedback?.("up");
        }}
      >
        <ThumbUpIcon size={13} />
      </button>
      <button
        type="button"
        className="ui-ma__btn"
        data-bad={feedback === "down" || undefined}
        aria-label="Bad response"
        aria-pressed={feedback === "down"}
        onClick={() => {
          setFeedback("down");
          onFeedback?.("down");
        }}
      >
        <ThumbDownIcon size={13} />
      </button>

      <button
        type="button"
        className="ui-ma__btn"
        data-listening={listening || undefined}
        aria-label={listening ? "Stop reading aloud" : "Read aloud"}
        aria-pressed={listening}
        onClick={() => setListening((prev) => !prev)}
      >
        {listening ? (
          <span className="ui-ma__eq" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <VolumeIcon size={13} />
        )}
      </button>
    </div>
  );
}
