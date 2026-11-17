"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { Switch } from "./Switch";
import { CheckIcon, ChevronDownIcon, SparkleIcon } from "../../lib/icons";

const CSS = `
.ui-mp { position: relative; display: inline-block; max-width: 100%; }
.ui-mp__trigger {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 9px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-fill);
  color: var(--ui-ink-soft);
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear;
  max-width: 100%;
}
.ui-mp__trigger:hover, .ui-mp__trigger[aria-expanded="true"] { background: var(--ui-fill-strong); color: var(--ui-ink); }
.ui-mp__trigger:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }
.ui-mp__trigger svg:first-child { color: var(--ui-accent); }
.ui-mp__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-mp__chev { color: var(--ui-faint); transition: transform var(--ui-dur) var(--ui-ease); }
.ui-mp__trigger[aria-expanded="true"] .ui-mp__chev { transform: rotate(180deg); }

.ui-mp__panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 50;
  width: 296px;
  max-width: min(296px, calc(100vw - 32px));
  padding: 5px;
  border-radius: var(--ui-r-lg);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow-pop);
  animation: ui-mp-in 180ms var(--ui-ease);
  transform-origin: bottom left;
}
@keyframes ui-mp-in {
  from { opacity: 0; transform: translateY(5px) scale(.985); }
  to { opacity: 1; transform: none; }
}
.ui-mp__head {
  padding: 6px 7px 4px;
  font-size: var(--text-2xs); font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--ui-faint);
}
.ui-mp__item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 7px; border-radius: var(--ui-r-sm);
  text-align: left; color: var(--ui-ink-soft);
  transition: background var(--ui-dur-fast) linear;
}
.ui-mp__item:hover, .ui-mp__item[data-active="true"] { background: var(--ui-wash); }
.ui-mp__item:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: -2px; }
.ui-mp__item[aria-selected="true"] { background: var(--ui-accent-soft); }
.ui-mp__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ui-mp__title { display: flex; align-items: center; gap: 5px; font-size: var(--text-base); font-weight: var(--weight-medium); color: var(--ui-ink); letter-spacing: -0.006em; }
.ui-mp__tag {
  font-size: 9px; padding: 1px 4px; border-radius: 3px;
  background: var(--ui-fill); color: var(--ui-muted); font-weight: var(--weight-medium);
  letter-spacing: 0.01em;
}
.ui-mp__desc { font-size: var(--text-xs); color: var(--ui-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-mp__check { color: var(--ui-accent); opacity: 0; flex: none; }
.ui-mp__item[aria-selected="true"] .ui-mp__check { opacity: 1; }

.ui-mp__bars { display: flex; align-items: flex-end; gap: 3px; flex: none; padding-right: 2px; }
.ui-mp__bar { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ui-mp__bar-track { width: 4px; height: 18px; border-radius: 2px; background: var(--ui-fill); display: flex; align-items: flex-end; overflow: hidden; }
.ui-mp__bar-fill {
  width: 100%; border-radius: 2px; background: var(--ui-faint);
  transition: height var(--ui-dur-slow) var(--ui-ease), background var(--ui-dur) linear;
  height: 0;
}
.ui-mp__item[data-active="true"] .ui-mp__bar-fill,
.ui-mp__item[aria-selected="true"] .ui-mp__bar-fill { background: var(--ui-accent); }
.ui-mp__bar-key { font-size: 7px; letter-spacing: 0; color: var(--ui-faint); text-transform: uppercase; }

.ui-mp__section { border-top: 1px solid var(--ui-line); margin: 4px 5px 0; padding: 8px 2px 4px; display: flex; flex-direction: column; gap: 6px; }
.ui-mp__thinking { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ui-mp__thinking-title { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--ui-ink-soft); }
.ui-mp__effort {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
  padding: 2px; border-radius: var(--ui-r-sm); background: var(--ui-fill);
  animation: ui-mp-unfold 220ms var(--ui-ease);
  transform-origin: top;
}
@keyframes ui-mp-unfold {
  from { opacity: 0; transform: scaleY(.8); }
  to { opacity: 1; transform: none; }
}
.ui-mp__effort button {
  height: 22px; border-radius: 5px; font-size: var(--text-xs); font-weight: var(--weight-medium);
  color: var(--ui-muted); transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear;
}
.ui-mp__effort button[aria-pressed="true"] { background: var(--ui-card); color: var(--ui-ink); box-shadow: var(--ui-shadow); }

.ui-mp__tray {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  margin: 4px 5px 5px;
  padding: 7px 8px;
  border-radius: var(--ui-r-sm);
  background: var(--ui-wash);
  border: 1px solid var(--ui-line);
  font-size: var(--text-2xs); color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}
.ui-mp__tray strong { color: var(--ui-ink-soft); font-weight: var(--weight-medium); }

@media (prefers-reduced-motion: reduce) {
  .ui-mp__panel, .ui-mp__effort { animation: none; }
}
`;

injectCss("ui-model-picker", CSS);

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  speed: number;
  quality: number;
  cost: number;
  firstTokenMs?: number;
  priceIn?: number;
  priceOut?: number;
}

export interface ModelPickerProps {
  models: ModelOption[];
  value?: string;
  onChange?: (model: ModelOption) => void;
  thinking?: boolean;
  onThinkingChange?: (value: boolean) => void;
  effort?: "low" | "medium" | "high";
  onEffortChange?: (value: "low" | "medium" | "high") => void;
  className?: string;
}

export function ModelPicker({
  models,
  value,
  onChange,
  thinking = true,
  onThinkingChange,
  effort = "medium",
  onEffortChange,
  className,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(models[0]?.id ?? "");
  const [hovered, setHovered] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(thinking);
  const [internalEffort, setInternalEffort] = useState(effort);
  const root = useRef<HTMLDivElement | null>(null);

  const selectedId = value ?? internal;
  const selected = models.find((model) => model.id === selectedId) ?? models[0];
  const preview = models.find((model) => model.id === hovered) ?? selected;
  const activeEffort = onEffortChange ? effort : internalEffort;

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  useEffect(() => {
    setInternalEffort(effort);
  }, [effort]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (model: ModelOption) => {
    setInternal(model.id);
    onChange?.(model);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    const index = Math.max(0, models.findIndex((model) => model.id === preview?.id));
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = models[(index + delta + models.length) % models.length];
      if (next) setHovered(next.id);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setHovered((event.key === "Home" ? models[0] : models[models.length - 1])?.id ?? null);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (preview) choose(preview);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={cx("ui-mp", className)} ref={root}>
      <button
        type="button"
        className="ui-mp__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Model: ${selected?.name ?? "Auto"}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onKeyDown}
      >
        <SparkleIcon size={13} />
        <span className="ui-mp__name">{selected?.name ?? "Auto"}</span>
        {isThinking ? <span className="ui-mp__tag">thinking</span> : null}
        <ChevronDownIcon size={12} className="ui-mp__chev" />
      </button>

      {open ? (
        <div className="ui-mp__panel" role="listbox" aria-label="Choose a model">
          <div className="ui-mp__head">Model</div>
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              role="option"
              aria-selected={model.id === selectedId}
              className="ui-mp__item"
              data-active={model.id === preview?.id || undefined}
              onMouseEnter={() => setHovered(model.id)}
              onFocus={() => setHovered(model.id)}
              onClick={() => choose(model)}
            >
              <span className="ui-mp__main">
                <span className="ui-mp__title">
                  {model.name}
                  {model.tag ? <span className="ui-mp__tag">{model.tag}</span> : null}
                </span>
                {model.description ? <span className="ui-mp__desc">{model.description}</span> : null}
              </span>
              <span className="ui-mp__bars" aria-hidden="true">
                {(
                  [
                    ["s", model.speed],
                    ["q", model.quality],
                    ["$", 1 - model.cost],
                  ] as const
                ).map(([key, level]) => (
                  <span className="ui-mp__bar" key={key}>
                    <span className="ui-mp__bar-track">
                      <span className="ui-mp__bar-fill" style={{ height: `${Math.round(level * 100)}%` }} />
                    </span>
                    <span className="ui-mp__bar-key">{key}</span>
                  </span>
                ))}
              </span>
              <CheckIcon size={13} className="ui-mp__check" />
            </button>
          ))}

          <div className="ui-mp__section">
            <div className="ui-mp__thinking">
              <span className="ui-mp__thinking-title">Extended thinking</span>
              <Switch
                size="sm"
                checked={isThinking}
                onChange={(next) => {
                  setIsThinking(next);
                  onThinkingChange?.(next);
                }}
                aria-label="Extended thinking"
              />
            </div>
            {isThinking ? (
              <div className="ui-mp__effort" role="group" aria-label="Thinking effort">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={activeEffort === level}
                    onClick={() => {
                      setInternalEffort(level);
                      onEffortChange?.(level);
                    }}
                  >
                    {level[0]!.toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="ui-mp__tray">
            <span>
              First token <strong>~{((preview?.firstTokenMs ?? 420) / 1000).toFixed(1)}s</strong>
            </span>
            <span>
              <strong>${preview?.priceIn ?? 3}</strong> in · <strong>${preview?.priceOut ?? 15}</strong> out / M
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
