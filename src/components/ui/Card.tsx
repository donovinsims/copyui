"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-card {
  --ui-card-pad: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--ui-card);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-r-xl);
  box-shadow: var(--ui-shadow);
  color: var(--ui-ink);
  transition:
    box-shadow var(--ui-dur-slow) var(--ui-ease),
    transform var(--ui-dur-slow) var(--ui-ease),
    border-color var(--ui-dur) var(--ui-ease);
}
/* Direct content is padded; structured cards use header/body/footer slots. */
.ui-card:not(:has(> .ui-card__header, > .ui-card__body, > .ui-card__footer)) {
  padding: var(--ui-card-pad);
}
.ui-card[data-pad="none"] { --ui-card-pad: 0px; }
.ui-card[data-pad="sm"] { --ui-card-pad: 12px; }
.ui-card[data-pad="lg"] { --ui-card-pad: 24px; }
.ui-card[data-tone="tray"] { background: var(--ui-tray); }
.ui-card[data-tone="wash"] { background: var(--ui-wash); }
.ui-card[data-flush="true"] { border-radius: 0; border-left: 0; border-right: 0; box-shadow: none; }
.ui-card[data-interactive="true"] { cursor: pointer; text-align: left; width: 100%; font: inherit; }
.ui-card[data-interactive="true"]:hover {
  box-shadow: var(--ui-shadow-pop);
  border-color: var(--ui-line-strong);
  transform: translateY(-1px);
}
.ui-card[data-interactive="true"]:focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 2px; }

.ui-card__body { padding: var(--ui-card-pad); min-width: 0; }
.ui-card__body + .ui-card__body { padding-top: 0; }

.ui-card__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: var(--ui-card-pad);
  padding-bottom: 12px;
}
.ui-card__header-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
.ui-card__title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  letter-spacing: -0.012em;
  color: var(--ui-ink);
  line-height: 1.3;
}
.ui-card__description {
  font-size: var(--text-sm);
  color: var(--ui-muted);
  line-height: var(--leading-snug);
}
.ui-card__actions { display: flex; align-items: center; gap: 6px; flex: none; }

.ui-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px var(--ui-card-pad);
  border-top: 1px solid var(--ui-line);
  background: var(--ui-wash);
  border-radius: 0 0 var(--ui-r-xl) var(--ui-r-xl);
}
`;

injectCss("ui-card", CSS);

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  pad?: "none" | "sm" | "md" | "lg";
  tone?: "card" | "tray" | "wash";
  interactive?: boolean;
  flush?: boolean;
}

export function Card({
  children,
  pad = "md",
  tone = "card",
  interactive,
  flush,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx("ui-card", className)}
      data-pad={pad}
      data-tone={tone}
      data-interactive={interactive || undefined}
      data-flush={flush || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="ui-card__header">
      {icon ? <span className="ui-card__header-icon">{icon}</span> : null}
      <div className="ui-card__header-main">
        <div className="ui-card__title">{title}</div>
        {description ? <div className="ui-card__description">{description}</div> : null}
      </div>
      {actions ? <div className="ui-card__actions">{actions}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("ui-card__body", className)} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="ui-card__footer">{children}</div>;
}
