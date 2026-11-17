"use client";

import { injectCss } from "../../lib/css";
import { cx, initials, tintFor } from "../../lib/utils";

const CSS = `
.ui-avatar {
  --ui-av-size: 24px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ui-av-size);
  height: var(--ui-av-size);
  flex: none;
  border-radius: 50%;
  background: hsl(var(--ui-av-hue) 85% 94%);
  color: hsl(var(--ui-av-hue) 55% 34%);
  font-size: calc(var(--ui-av-size) * 0.38);
  font-weight: var(--weight-semibold);
  letter-spacing: 0;
  line-height: 1;
  user-select: none;
  box-shadow: inset 0 0 0 1px hsl(var(--ui-av-hue) 50% 40% / 0.14);
  overflow: hidden;
}
:root[data-theme="dark"] .ui-avatar,
.dark .ui-avatar {
  background: hsl(var(--ui-av-hue) 40% 20%);
  color: hsl(var(--ui-av-hue) 80% 78%);
  box-shadow: inset 0 0 0 1px hsl(var(--ui-av-hue) 60% 70% / 0.2);
}
.ui-avatar img { width: 100%; height: 100%; object-fit: cover; }

.ui-avatar[data-square="true"] { border-radius: calc(var(--ui-av-size) * 0.3); }

.ui-avatar__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--ui-card);
  background: var(--ui-ok);
}
.ui-avatar__status[data-status="busy"] { background: var(--ui-warn); }
.ui-avatar__status[data-status="idle"] { background: var(--ui-faint); }

.ui-avatar-stack { display: inline-flex; align-items: center; }
.ui-avatar-stack .ui-avatar { box-shadow: 0 0 0 2px var(--ui-card), inset 0 0 0 1px hsl(var(--ui-av-hue) 50% 40% / .14); }
.ui-avatar-stack .ui-avatar + .ui-avatar { margin-left: -7px; }
.ui-avatar-stack[data-size="lg"] .ui-avatar + .ui-avatar { margin-left: -9px; }
.ui-avatar-stack__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--ui-av-size, 24px);
  min-width: var(--ui-av-size, 24px);
  padding: 0 5px;
  margin-left: -6px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-card);
  box-shadow: 0 0 0 2px var(--ui-card), inset 0 0 0 1px var(--ui-line-strong);
  color: var(--ui-muted);
  font-size: 10px;
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
}
`;

injectCss("ui-avatar", CSS);

export interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
  square?: boolean;
  status?: "online" | "busy" | "idle";
  className?: string;
}

export function Avatar({ name, size = 24, src, square, status, className }: AvatarProps) {
  const hue = tintFor(name);
  return (
    <span
      className={cx("ui-avatar", className)}
      style={{ ["--ui-av-size" as string]: `${size}px`, ["--ui-av-hue" as string]: hue }}
      data-square={square || undefined}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
      {status ? <span className="ui-avatar__status" data-status={status} aria-hidden="true" /> : null}
      <span className="u-sr-only">{name}</span>
    </span>
  );
}

export function AvatarStack({
  names,
  size = 22,
  max = 3,
}: {
  names: string[];
  size?: number;
  max?: number;
}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="ui-avatar-stack" style={{ ["--ui-av-size" as string]: `${size}px` }}>
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
      {rest > 0 ? <span className="ui-avatar-stack__more">+{rest}</span> : null}
    </span>
  );
}
