import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  MicIcon,
  PaperclipIcon,
  PlugIcon,
  ShieldIcon,
  SparkleIcon,
} from "../../lib/icons";

const CSS = `
.ui-cc {
  --ui-cc-radius: var(--ui-r-xl);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 10px 10px 8px;
  border-radius: var(--ui-cc-radius);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow);
  color: var(--ui-ink);
  transition: border-color var(--ui-dur) var(--ui-ease), box-shadow var(--ui-dur-slow) var(--ui-ease);
  container-type: inline-size;
}
.ui-cc:focus-within {
  border-color: var(--ui-accent-line);
  box-shadow: var(--ui-shadow-pop);
}

.ui-cc__field {
  width: 100%;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  padding: 6px 6px 2px;
  min-height: 44px;
  max-height: 168px;
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--ui-ink);
  letter-spacing: -0.006em;
}
.ui-cc__field::placeholder { color: var(--ui-faint); }

.ui-cc__dock {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 2px 0;
  min-width: 0;
}
.ui-cc__dock-right { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.ui-cc__dock-left { display: flex; align-items: center; gap: 2px; min-width: 0; }

.ui-cc__tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 7px;
  border-radius: var(--ui-r-pill);
  color: var(--ui-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) var(--ui-ease), color var(--ui-dur-fast) var(--ui-ease);
  max-width: 180px;
  white-space: nowrap;
}
.ui-cc__tool:hover,
.ui-cc__tool[aria-expanded="true"] { background: var(--ui-hover); color: var(--ui-ink); }
.ui-cc__tool:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }
.ui-cc__tool[data-square="true"] { width: 26px; padding: 0; justify-content: center; }
.ui-cc__tool svg { opacity: 0.78; }
.ui-cc__tool[aria-expanded="true"] svg { opacity: 1; }
.ui-cc__tool-label { overflow: hidden; text-overflow: ellipsis; }

.ui-cc__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ui-solid);
  color: var(--ui-on-solid);
  box-shadow: var(--shadow-inset-top);
  transition: transform var(--ui-dur-fast) var(--ui-ease), opacity var(--ui-dur) linear, background var(--ui-dur) linear;
}
.ui-cc__send:hover { transform: scale(1.04); }
.ui-cc__send:active { transform: scale(0.94); }
.ui-cc__send:disabled { opacity: 0.3; pointer-events: none; }
.ui-cc__send:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }

.ui-cc__approval {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border-radius: var(--ui-r-pill);
  border: 1px solid var(--ui-line);
  color: var(--ui-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: background var(--ui-dur-fast) var(--ui-ease), border-color var(--ui-dur-fast) var(--ui-ease);
}
.ui-cc__approval:hover { background: var(--ui-hover); border-color: var(--ui-line-strong); }
.ui-cc__approval[data-busy="true"] { color: var(--ui-muted); }
.ui-cc__approval[data-busy="true"] svg { animation: ui-cc-spin 900ms linear infinite; }
@keyframes ui-cc-spin { to { transform: rotate(360deg); } }

.ui-cc__apps { display: inline-flex; align-items: center; padding: 0 2px; }
.ui-cc__app {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: var(--weight-semibold);
  color: #fff;
  box-shadow: 0 0 0 1.5px var(--ui-card);
  margin-left: -4px;
}
.ui-cc__app:first-child { margin-left: 0; }

.ui-cc__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 8px;
  z-index: 40;
  min-width: 216px;
  max-width: min(320px, calc(100cqw - 16px));
  padding: 4px;
  border-radius: var(--ui-r-lg);
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  box-shadow: var(--ui-shadow-pop);
  animation: ui-cc-menu-in 160ms var(--ui-ease);
  transform-origin: bottom left;
}
.ui-cc__menu[data-align="right"] { left: auto; right: 8px; transform-origin: bottom right; }
@keyframes ui-cc-menu-in {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.ui-cc__menu-head {
  padding: 6px 8px 5px;
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ui-faint);
}
.ui-cc__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--ui-r-sm);
  color: var(--ui-ink-soft);
  font-size: var(--text-base);
  text-align: left;
  transition: background var(--ui-dur-fast) linear, color var(--ui-dur-fast) linear;
}
.ui-cc__item:hover,
.ui-cc__item[data-active="true"] { background: var(--ui-hover); color: var(--ui-ink); }
.ui-cc__item[aria-selected="true"] { color: var(--ui-ink); font-weight: var(--weight-medium); }
.ui-cc__item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ui-cc__item-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-cc__item-desc { font-size: var(--text-xs); color: var(--ui-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-cc__item-check { color: var(--ui-accent); opacity: 0; }
.ui-cc__item[aria-selected="true"] .ui-cc__item-check { opacity: 1; }
.ui-cc__menu-sep { height: 1px; margin: 4px 6px; background: var(--ui-line); }

.ui-cc__recording {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ui-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding-right: 4px;
}
.ui-cc__rec-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: ui-cc-pulse 1.3s var(--ui-ease) infinite;
}
@keyframes ui-cc-pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  60% { box-shadow: 0 0 0 4px transparent; opacity: .6; }
}

.ui-cc[data-stage="true"] {
  min-height: 172px;
  padding-bottom: 0;
}
.ui-cc[data-stage="true"] .ui-cc__field { min-height: 72px; }
.ui-cc__stage-footer {
  margin: auto -10px 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-top: 1px solid var(--ui-line);
  border-radius: 0 0 var(--ui-cc-radius) var(--ui-cc-radius);
  background: var(--ui-tray);
}
.ui-cc__stage-item {
  min-width: 0;
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 7px;
  border-radius: 8px;
  color: var(--ui-ink-soft);
  font-size: 12px;
  font-weight: var(--weight-regular);
  white-space: nowrap;
}
.ui-cc__stage-item:hover { background: var(--ui-hover); }
.ui-cc__stage-item:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; }
.ui-cc__stage-item > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ui-cc__stage-item svg { flex: none; opacity: 0.72; }
.ui-cc__stage-item--apps { margin-left: auto; gap: 8px; }
.ui-cc__stage-item--apps .ui-cc__apps { padding: 0; }

@media (max-width: 520px) {
  .ui-cc__approval span { display: none; }
  .ui-cc__approval { width: 26px; padding: 0; justify-content: center; }
  .ui-cc__tool[data-folder="true"] .ui-cc__tool-label { display: none; }
  .ui-cc__tool[data-folder="true"] { width: 26px; padding: 0; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-cc__rec-dot,
  .ui-cc__menu { animation: none; }
}
`;

injectCss("ui-chat-composer", CSS);

export interface ChatModel {
  id: string;
  name: string;
  description?: string;
}

export interface ChatApp {
  id: string;
  name: string;
  mark: string;
  color: string;
}

export interface ChatComposerProps {
  placeholder?: string;
  models?: ChatModel[];
  defaultModelId?: string;
  loadMs?: number;
  dictation?: string;
  folders?: string[];
  defaultFolder?: string | null;
  apps?: ChatApp[];
  connectedApps?: string[];
  onSend?: (message: string, details: { model: string }) => void;
  onModelChange?: (model: ChatModel) => void;
  onAttach?: () => void;
  onRequestApproval?: () => void;
  onFolderChange?: (folder: string | null) => void;
  onAppsChange?: (connected: string[]) => void;
  stageLayout?: boolean;
  className?: string;
}

const DEFAULT_MODELS: ChatModel[] = [
  { id: "auto", name: "Auto", description: "Picks the best model" },
  { id: "claude", name: "Claude", description: "Long context and careful edits" },
  { id: "gpt", name: "ChatGPT", description: "Fast answers and tools" },
];

const DEFAULT_APPS: ChatApp[] = [
  { id: "gmail", name: "Gmail", mark: "M", color: "#e5484d" },
  { id: "slack", name: "Slack", mark: "S", color: "#4a154b" },
  { id: "linear", name: "Linear", mark: "L", color: "#5e6ad2" },
];

const DEFAULT_FOLDERS = ["Product", "Design", "Marketing", "Research"];

type MenuName = "model" | "folder" | "apps";

export function ChatComposer({
  placeholder = "Start by typing...",
  models = DEFAULT_MODELS,
  defaultModelId,
  loadMs = 1300,
  dictation = "Draft a short update on the launch plan",
  folders = DEFAULT_FOLDERS,
  defaultFolder = null,
  apps = DEFAULT_APPS,
  connectedApps = ["gmail"],
  onSend,
  onModelChange,
  onAttach,
  onRequestApproval,
  onFolderChange,
  onAppsChange,
  stageLayout = false,
  className,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [modelId, setModelId] = useState(defaultModelId ?? models[0]?.id ?? "auto");
  const [folder, setFolder] = useState<string | null>(defaultFolder);
  const [connected, setConnected] = useState<string[]>(connectedApps);
  const [menu, setMenu] = useState<MenuName | null>(null);
  const [active, setActive] = useState(0);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const words = useRef<string[]>([]);
  const model = models.find((entry) => entry.id === modelId) ?? models[0];

  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 168)}px`;
  }, [value]);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menu]);

  const items: ChatModel[] = menu === "model" ? models : [];
  const folderItems = menu === "folder" ? folders : [];

  const openMenu = (name: MenuName) => {
    if (menu === name) {
      setMenu(null);
      return;
    }
    setMenu(name);
    setActive(name === "model" ? Math.max(0, models.findIndex((entry) => entry.id === modelId)) : 0);
  };

  const choose = (index: number) => {
    if (menu === "model") {
      const next = models[index];
      if (next) {
        setModelId(next.id);
        onModelChange?.(next);
        setNotice(`${next.name} selected`);
      }
    } else if (menu === "folder") {
      const next = folders[index] ?? null;
      setFolder(next);
      onFolderChange?.(next);
      setNotice(next ? `Working in ${next}` : "No folder selected");
    } else if (menu === "apps") {
      const app = apps[index];
      if (app) {
        const next = connected.includes(app.id)
          ? connected.filter((id) => id !== app.id)
          : [...connected, app.id];
        setConnected(next);
        onAppsChange?.(next);
        setNotice(`${app.name} ${next.includes(app.id) ? "connected" : "disconnected"}`);
      }
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLButtonElement>, count: number) => {
    if (!menu) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu(event.currentTarget.dataset.menu as MenuName);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(null);
      return;
    }
    if (event.key === "Tab") {
      setMenu(null);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((prev) => (prev + delta + count) % count);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : count - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
      setMenu(null);
    }
  };

  const startRecording = () => {
    if (recording) {
      setRecording(false);
      return;
    }
    words.current = dictation.split(" ");
    setRecording(true);
    setNotice("Listening");
    let index = 0;
    const id = window.setInterval(() => {
      const word = words.current[index];
      if (!word) {
        window.clearInterval(id);
        setRecording(false);
        setNotice("Dictation finished");
        return;
      }
      setValue((prev) => (prev ? `${prev} ${word}` : word));
      index += 1;
    }, 320);
  };

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text, { model: model?.name ?? "Auto" });
    setValue("");
    setNotice("Message sent");
  };

  const requestApproval = () => {
    setApprovalBusy(true);
    onRequestApproval?.();
    window.setTimeout(() => {
      setApprovalBusy(false);
      setNotice("Approval requested");
    }, loadMs);
  };

  const shownApps = apps.filter((app) => connected.includes(app.id)).slice(0, 3);

  return (
    <div
      ref={root}
      className={cx("ui-cc", className)}
      data-stage={stageLayout || undefined}
      onClick={() => textarea.current?.focus()}
    >
      <textarea
        ref={textarea}
        className="ui-cc__field"
        placeholder={placeholder}
        value={value}
        rows={1}
        aria-label="Message"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />

      <div className="ui-cc__dock">
        <div className="ui-cc__dock-left">
          <button
            type="button"
            className="ui-cc__tool"
            data-square="true"
            aria-label="Add attachment"
            onClick={(event) => {
              event.stopPropagation();
              onAttach?.();
              setNotice("Attachment picker opened");
            }}
          >
            <PaperclipIcon size={15} />
          </button>

          <button
            type="button"
            className="ui-cc__tool"
            data-menu="model"
            aria-haspopup="listbox"
            aria-expanded={menu === "model"}
            aria-controls="ui-cc-model-menu"
            onClick={(event) => {
              event.stopPropagation();
              openMenu("model");
            }}
            onKeyDown={(event) => onMenuKeyDown(event, models.length)}
          >
            <SparkleIcon size={14} />
            <span className="ui-cc__tool-label">{model?.name ?? "Auto"}</span>
            <ChevronDownIcon size={12} />
          </button>

          {!stageLayout ? (
            <button
              type="button"
              className="ui-cc__tool"
              data-folder="true"
              data-menu="folder"
              aria-haspopup="listbox"
              aria-expanded={menu === "folder"}
              aria-controls="ui-cc-folder-menu"
              onClick={(event) => {
                event.stopPropagation();
                openMenu("folder");
              }}
              onKeyDown={(event) => onMenuKeyDown(event, folders.length)}
            >
              <FolderIcon size={14} />
              <span className="ui-cc__tool-label">{folder ?? "Work in a folder"}</span>
            </button>
          ) : null}

          {recording ? (
            <span className="ui-cc__recording" aria-hidden="true">
              <span className="ui-cc__rec-dot" />
              Listening
            </span>
          ) : null}
        </div>

        <div className="ui-cc__dock-right">
          <button
            type="button"
            className="ui-cc__approval"
            data-busy={approvalBusy || undefined}
            aria-busy={approvalBusy || undefined}
            onClick={(event) => {
              event.stopPropagation();
              requestApproval();
            }}
          >
            <ShieldIcon size={13} />
            <span>{approvalBusy ? "Requesting…" : "Request approval"}</span>
          </button>

          {!stageLayout ? (
            <button
              type="button"
              className="ui-cc__apps"
              data-menu="apps"
              aria-label="Connect apps"
              aria-haspopup="menu"
              aria-expanded={menu === "apps"}
              aria-controls="ui-cc-apps-menu"
              onClick={(event) => {
                event.stopPropagation();
                openMenu("apps");
              }}
              onKeyDown={(event) => onMenuKeyDown(event, apps.length)}
            >
              {shownApps.length ? (
                shownApps.map((app) => (
                  <span
                    key={app.id}
                    className="ui-cc__app"
                    style={{ background: app.color }}
                    title={app.name}
                  >
                    {app.mark}
                  </span>
                ))
              ) : (
                <span className="ui-cc__tool" style={{ pointerEvents: "none" }}>
                  <PlugIcon size={14} />
                </span>
              )}
            </button>
          ) : null}

          <button
            type="button"
            className="ui-cc__tool"
            data-square="true"
            aria-label={recording ? "Stop dictation" : "Start dictation"}
            aria-pressed={recording}
            onClick={(event) => {
              event.stopPropagation();
              startRecording();
            }}
          >
            <MicIcon size={15} />
          </button>

          <button
            type="button"
            className="ui-cc__send"
            aria-label="Send message"
            disabled={!value.trim()}
            onClick={(event) => {
              event.stopPropagation();
              send();
            }}
          >
            <ArrowUpIcon size={15} />
          </button>
        </div>
      </div>

      {stageLayout ? (
        <div className="ui-cc__stage-footer">
          <button
            type="button"
            className="ui-cc__stage-item"
            data-menu="folder"
            aria-haspopup="listbox"
            aria-expanded={menu === "folder"}
            aria-controls="ui-cc-folder-menu"
            onClick={(event) => {
              event.stopPropagation();
              openMenu("folder");
            }}
            onKeyDown={(event) => onMenuKeyDown(event, folders.length)}
          >
            <FolderIcon size={14} />
            <span>{folder ?? "Work in a folder"}</span>
          </button>
          <button
            type="button"
            className="ui-cc__stage-item ui-cc__stage-item--apps"
            data-menu="apps"
            aria-haspopup="menu"
            aria-expanded={menu === "apps"}
            aria-controls="ui-cc-apps-menu"
            onClick={(event) => {
              event.stopPropagation();
              openMenu("apps");
            }}
            onKeyDown={(event) => onMenuKeyDown(event, apps.length)}
          >
            <span>Connect apps</span>
            <span className="ui-cc__apps">
              {shownApps.length ? (
                shownApps.map((app) => (
                  <span
                    key={app.id}
                    className="ui-cc__app"
                    style={{ background: app.color }}
                    title={app.name}
                  >
                    {app.mark}
                  </span>
                ))
              ) : (
                <PlugIcon size={14} />
              )}
            </span>
          </button>
        </div>
      ) : null}

      {menu === "model" ? (
        <div
          className="ui-cc__menu"
          id="ui-cc-model-menu"
          role="listbox"
          aria-label="Model"
          aria-activedescendant={`ui-cc-opt-${items[active]?.id ?? ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ui-cc__menu-head">Model</div>
          {items.map((item, index) => (
            <div
              key={item.id}
              id={`ui-cc-opt-${item.id}`}
              role="option"
              tabIndex={-1}
              aria-selected={item.id === modelId}
              data-active={index === active || undefined}
              className="ui-cc__item"
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                choose(index);
                setMenu(null);
              }}
            >
              <span className="ui-cc__item-main">
                <span className="ui-cc__item-name">{item.name}</span>
                {item.description ? (
                  <span className="ui-cc__item-desc">{item.description}</span>
                ) : null}
              </span>
              <CheckIcon size={14} className="ui-cc__item-check" />
            </div>
          ))}
        </div>
      ) : null}

      {menu === "folder" ? (
        <div
          className="ui-cc__menu"
          id="ui-cc-folder-menu"
          role="listbox"
          aria-label="Work in a folder"
          aria-activedescendant={`ui-cc-folder-${active}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ui-cc__menu-head">Folder</div>
          {folderItems.map((item, index) => (
            <div
              key={item}
              id={`ui-cc-folder-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={item === folder}
              data-active={index === active || undefined}
              className="ui-cc__item"
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                choose(index);
                setMenu(null);
              }}
            >
              <FolderIcon size={14} />
              <span className="ui-cc__item-main">
                <span className="ui-cc__item-name">{item}</span>
              </span>
              <CheckIcon size={14} className="ui-cc__item-check" />
            </div>
          ))}
          <div className="ui-cc__menu-sep" />
          <div
            role="option"
            tabIndex={-1}
            aria-selected={folder === null}
            className="ui-cc__item"
            onClick={() => {
              setFolder(null);
              onFolderChange?.(null);
              setMenu(null);
              setNotice("No folder selected");
            }}
          >
            <span className="ui-cc__item-main">
              <span className="ui-cc__item-name">No folder</span>
            </span>
          </div>
        </div>
      ) : null}

      {menu === "apps" ? (
        <div
          className="ui-cc__menu"
          data-align="right"
          id="ui-cc-apps-menu"
          role="menu"
          aria-label="Connect apps"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ui-cc__menu-head">Connect apps</div>
          {apps.map((app, index) => {
            const isOn = connected.includes(app.id);
            return (
              <div
                key={app.id}
                role="menuitemcheckbox"
                aria-checked={isOn}
                tabIndex={-1}
                data-active={index === active || undefined}
                className="ui-cc__item"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <span className="ui-cc__app" style={{ background: app.color }}>
                  {app.mark}
                </span>
                <span className="ui-cc__item-main">
                  <span className="ui-cc__item-name">{app.name}</span>
                </span>
                {isOn ? <CheckIcon size={14} className="ui-cc__item-check" /> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <span className="u-sr-only" role="status" aria-live="polite">
        {notice}
      </span>
    </div>
  );
}
