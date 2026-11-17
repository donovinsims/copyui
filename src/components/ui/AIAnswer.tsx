"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { useReducedMotion } from "../../lib/hooks";
import { CheckIcon, CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon } from "../../lib/icons";

const CSS = `
.ui-ai {
  --ui-ai-max: 640px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  width: 100%;
  max-width: var(--ui-ai-max);
  color: var(--ui-ink);
  font-size: var(--text-md);
  line-height: 1.62;
  letter-spacing: -0.006em;
}
.ui-ai__question {
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  color: var(--ui-ink);
  letter-spacing: -0.012em;
  margin-bottom: 1px;
}

.ui-ai__sources {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  margin: 0 -2px;
  padding-left: 2px;
  padding-right: 2px;
}
.ui-ai__sources::-webkit-scrollbar { display: none; }
.ui-ai__source {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: none;
  width: 176px;
  padding: 8px 9px;
  border-radius: var(--ui-r-md);
  background: var(--ui-wash);
  border: 1px solid var(--ui-line);
  text-align: left;
  transition: background var(--ui-dur) var(--ui-ease), border-color var(--ui-dur) var(--ui-ease), transform var(--ui-dur) var(--ui-ease);
}
.ui-ai__source:hover {
  background: var(--ui-card);
  border-color: var(--ui-line-strong);
  transform: translateY(-1px);
}
.ui-ai__source:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-ai__source-top { display: flex; align-items: center; gap: 5px; min-width: 0; }
.ui-ai__source-mark {
  width: 14px; height: 14px; border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--ui-fill); color: var(--ui-ink-muted);
  font-size: 8px; font-weight: var(--weight-semibold); flex: none;
}
.ui-ai__source-name { font-size: var(--text-2xs); font-weight: var(--weight-medium); color: var(--ui-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-ai__source-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--ui-ink-soft);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ui-ai__source-snippet {
  font-size: var(--text-2xs);
  color: var(--ui-faint);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ui-ai__body { display: flex; flex-direction: column; gap: 9px; }
.ui-ai__body p { margin: 0; color: var(--ui-ink-soft); }
.ui-ai__body strong { color: var(--ui-ink); font-weight: var(--weight-semibold); }
.ui-ai__body ul { display: flex; flex-direction: column; gap: 4px; padding-left: 2px; }
.ui-ai__body li { position: relative; padding-left: 13px; color: var(--ui-ink-soft); }
.ui-ai__body li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 0.62em;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ui-faint);
}

.ui-ai__caret {
  display: inline-block;
  width: 1.5px;
  height: 13px;
  margin-left: 1px;
  vertical-align: -2px;
  background: var(--ui-accent);
  animation: ui-ai-blink 1s steps(2, start) infinite;
}
@keyframes ui-ai-blink { 50% { opacity: 0; } }

.ui-ai__cite-wrap { position: relative; display: inline-block; }
.ui-ai__cite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  margin: 0 1px;
  border-radius: 4px;
  background: var(--ui-accent-soft);
  color: var(--ui-accent);
  font-size: 9px;
  font-weight: var(--weight-semibold);
  line-height: 1;
  vertical-align: 1px;
  font-variant-numeric: tabular-nums;
  transition: background var(--ui-dur-fast) linear;
}
.ui-ai__cite:hover { background: color-mix(in oklab, var(--ui-accent) 20%, transparent); }
.ui-ai__cite-pop {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translate(-50%, 3px);
  width: 220px;
  padding: 8px 9px;
  border-radius: var(--ui-r-md);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow-pop);
  opacity: 0;
  pointer-events: none;
  z-index: 30;
  transition: opacity var(--ui-dur) var(--ui-ease), transform var(--ui-dur) var(--ui-ease);
  text-align: left;
}
.ui-ai__cite-wrap:hover .ui-ai__cite-pop,
.ui-ai__cite:focus-visible + .ui-ai__cite-pop {
  opacity: 1;
  transform: translate(-50%, 0);
}
.ui-ai__cite-pop-name {
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ui-faint);
  margin-bottom: 3px;
}
.ui-ai__cite-pop-title { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--ui-ink); line-height: 1.35; }
.ui-ai__cite-pop-snippet { font-size: var(--text-xs); color: var(--ui-muted); line-height: 1.4; margin-top: 3px; }

.ui-ai__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  padding-top: 9px;
  border-top: 1px solid var(--ui-line);
}
.ui-ai__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 26px;
  min-width: 26px;
  padding: 0 7px;
  border-radius: var(--ui-r-pill);
  color: var(--ui-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) var(--ui-ease), color var(--ui-dur-fast) var(--ui-ease);
}
.ui-ai__action:hover { background: var(--ui-hover); color: var(--ui-ink); }
.ui-ai__action:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }
.ui-ai__action[data-on="true"] { color: var(--ui-accent); }
.ui-ai__action[data-good="true"] { color: var(--ui-ok); }
.ui-ai__action[data-bad="true"] { color: var(--ui-danger); }
.ui-ai__action svg { flex: none; }
.ui-ai__spin { animation: ui-ai-spin 700ms linear infinite; }
@keyframes ui-ai-spin { to { transform: rotate(360deg); } }
.ui-ai__actions-sep { width: 1px; height: 14px; background: var(--ui-line); margin: 0 4px; }

.ui-ai__reasons { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-left: 4px; }
.ui-ai__reason {
  height: 22px;
  padding: 0 8px;
  border-radius: var(--ui-r-pill);
  border: 1px solid var(--ui-line);
  color: var(--ui-muted);
  font-size: var(--text-xs);
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear, border-color var(--ui-dur-fast) linear;
}
.ui-ai__reason:hover { color: var(--ui-ink); border-color: var(--ui-line-strong); }
.ui-ai__reason[aria-pressed="true"] { background: var(--ui-accent-soft); color: var(--ui-accent); border-color: transparent; }

.ui-ai__followups { display: flex; flex-direction: column; gap: 5px; }
.ui-ai__followup {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  align-self: flex-start;
  height: 30px;
  padding: 0 11px;
  border-radius: var(--ui-r-pill);
  border: 1px solid var(--ui-line);
  background: var(--ui-card);
  color: var(--ui-ink-soft);
  font-size: var(--text-sm);
  text-align: left;
  transition: background var(--ui-dur-fast) var(--ui-ease), border-color var(--ui-dur-fast) var(--ui-ease), transform var(--ui-dur-fast) var(--ui-ease);
}
.ui-ai__followup:hover { border-color: var(--ui-line-strong); transform: translateX(2px); }
.ui-ai__followup svg { color: var(--ui-faint); }

@media (prefers-reduced-motion: reduce) {
  .ui-ai__caret { animation: none; }
  .ui-ai__spin { animation: none; }
}
`;

injectCss("ui-ai-answer", CSS);

export interface AnswerSource {
  name: string;
  title: string;
  href?: string;
  snippet?: string;
}

export interface AIAnswerProps {
  question?: string;
  sources?: AnswerSource[];
  answer: string;
  streaming?: boolean;
  animate?: boolean;
  speed?: number;
  followUps?: string[];
  onFollowUp?: (question: string) => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  onFeedback?: (value: "up" | "down", reason?: string) => void;
  feedbackReasons?: string[];
  onCopy?: (text: string) => void;
  className?: string;
}

function Citation({ index, source }: { index: number; source: AnswerSource }) {
  return (
    <span className="ui-ai__cite-wrap">
      <button type="button" className="ui-ai__cite" aria-label={`Source ${index}: ${source.name}`}>
        {index}
      </button>
      <span className="ui-ai__cite-pop" role="tooltip">
        <span className="ui-ai__cite-pop-name">{source.name}</span>
        <span className="ui-ai__cite-pop-title" style={{ display: "block" }}>
          {source.title}
        </span>
        {source.snippet ? <span className="ui-ai__cite-pop-snippet" style={{ display: "block" }}>{source.snippet}</span> : null}
      </span>
    </span>
  );
}

function renderInline(text: string, sources: AnswerSource[], keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyBase}-b${key}`}>{token.slice(2, -2)}</strong>);
    } else {
      const numbers = token
        .slice(1, -1)
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => value >= 1 && value <= sources.length);
      numbers.forEach((number) => {
        const source = sources[number - 1];
        if (source) nodes.push(<Citation key={`${keyBase}-c${key}-${number}`} index={number} source={source} />);
      });
    }
    key += 1;
    cursor = match.index + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function AIAnswer({
  question,
  sources = [],
  answer,
  streaming = false,
  animate = true,
  speed = 38,
  followUps = [],
  onFollowUp,
  onRegenerate,
  onStop,
  onFeedback,
  feedbackReasons = ["Not accurate", "Wrong source", "Too long", "Out of date"],
  onCopy,
  className,
}: AIAnswerProps) {
  const reduced = useReducedMotion();
  const [visibleWords, setVisibleWords] = useState(0);
  const [copied, setCopied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [notice, setNotice] = useState("");
  const answerRef = useRef(answer);

  const words = useMemo(() => answer.split(/(\s+)/).filter(Boolean), [answer]);
  const instant = !animate || reduced;

  useEffect(() => {
    if (answerRef.current !== answer) answerRef.current = answer;
    setVisibleWords(instant ? words.length : 0);
  }, [answer, instant, words.length]);

  useEffect(() => {
    if (instant || visibleWords >= words.length) return;
    const step = Math.max(1, Math.round(speed / 20));
    const id = window.setInterval(() => {
      setVisibleWords((prev) => Math.min(words.length, prev + step));
    }, 50);
    return () => window.clearInterval(id);
  }, [instant, speed, visibleWords, words.length]);

  const shown = instant ? answer : words.slice(0, visibleWords).join("");
  const writing = streaming || (!instant && visibleWords < words.length);

  const blocks = useMemo(() => {
    return shown
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block.split("\n").map((line) => line.trim());
        const isList = lines.every((line) => line.startsWith("- "));
        return { isList, lines: isList ? lines.map((line) => line.slice(2)) : lines };
      });
  }, [shown]);

  const copy = async () => {
    const plain = `${answer}\n\nSources\n${sources
      .map((source, index) => `${index + 1}. ${source.name} — ${source.title}`)
      .join("\n")}`;
    try {
      await navigator.clipboard.writeText(plain);
    } catch {
      /* clipboard unavailable — still confirm for the demo */
    }
    setCopied(true);
    setNotice("Answer copied");
    onCopy?.(plain);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const regenerate = () => {
    setSpinning(true);
    onRegenerate?.();
    window.setTimeout(() => {
      setSpinning(false);
      setNotice("Answer regenerated");
    }, 700);
  };

  return (
    <div className={cx("ui-ai", className)} aria-busy={writing || undefined}>
      {question ? <div className="ui-ai__question">{question}</div> : null}

      {sources.length ? (
        <div className="ui-ai__sources" aria-label="Sources">
          {sources.map((source, index) => {
            const content = (
              <>
                <span className="ui-ai__source-top">
                  <span className="ui-ai__source-mark" aria-hidden="true">
                    {source.name.slice(0, 1)}
                  </span>
                  <span className="ui-ai__source-name">{source.name}</span>
                </span>
                <span className="ui-ai__source-title">{source.title}</span>
                {source.snippet ? <span className="ui-ai__source-snippet">{source.snippet}</span> : null}
              </>
            );
            return source.href ? (
              <a
                key={`${source.name}-${index}`}
                className="ui-ai__source"
                href={source.href}
                target="_blank"
                rel="noreferrer"
              >
                {content}
              </a>
            ) : (
              <div key={`${source.name}-${index}`} className="ui-ai__source">
                {content}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="ui-ai__body">
        {blocks.map((block, blockIndex) =>
          block.isList ? (
            <ul key={`block-${blockIndex}`}>
              {block.lines.map((line, lineIndex) => (
                <li key={`line-${blockIndex}-${lineIndex}`}>
                  {renderInline(line, sources, `i-${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          ) : (
            <p key={`block-${blockIndex}`}>
              {block.lines.map((line, lineIndex) => (
                <span key={`p-${blockIndex}-${lineIndex}`}>
                  {lineIndex > 0 ? " " : null}
                  {renderInline(line, sources, `p-${blockIndex}-${lineIndex}`)}
                </span>
              ))}
              {blockIndex === blocks.length - 1 && writing ? (
                <span className="ui-ai__caret" aria-hidden="true" />
              ) : null}
            </p>
          ),
        )}
      </div>

      {!writing ? (
        <>
          <div className="ui-ai__actions">
            <button
              type="button"
              className="ui-ai__action"
              onClick={() => void copy()}
              data-on={copied || undefined}
              aria-label="Copy answer"
            >
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              className="ui-ai__action"
              onClick={regenerate}
              aria-label="Regenerate answer"
            >
              <RefreshIcon size={14} className={spinning ? "ui-ai__spin" : undefined} />
              <span>Regenerate</span>
            </button>
            <span className="ui-ai__actions-sep" aria-hidden="true" />
            <button
              type="button"
              className="ui-ai__action"
              data-good={feedback === "up" || undefined}
              aria-pressed={feedback === "up"}
              aria-label="Good answer"
              onClick={() => {
                setFeedback("up");
                setReason(undefined);
                onFeedback?.("up");
                setNotice("Thanks for the feedback");
              }}
            >
              <ThumbUpIcon size={14} />
            </button>
            <button
              type="button"
              className="ui-ai__action"
              data-bad={feedback === "down" || undefined}
              aria-pressed={feedback === "down"}
              aria-label="Bad answer"
              onClick={() => {
                setFeedback("down");
                onFeedback?.("down");
              }}
            >
              <ThumbDownIcon size={14} />
            </button>

            {feedback === "down" ? (
              <div className="ui-ai__reasons" role="group" aria-label="What was wrong?">
                {feedbackReasons.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="ui-ai__reason"
                    aria-pressed={reason === option}
                    onClick={() => {
                      setReason(option);
                      onFeedback?.("down", option);
                      setNotice(`Feedback sent: ${option}`);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {followUps.length ? (
            <div className="ui-ai__followups">
              {followUps.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="ui-ai__followup"
                  onClick={() => onFollowUp?.(question)}
                >
                  <span>{question}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : onStop ? (
        <div className="ui-ai__actions">
          <button type="button" className="ui-ai__action" onClick={onStop}>
            <span>Stop writing</span>
          </button>
        </div>
      ) : null}

      <span className="u-sr-only" role="status" aria-live="polite">
        {notice}
      </span>
    </div>
  );
}
