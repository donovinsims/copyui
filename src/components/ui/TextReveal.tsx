"use client";

import type { ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { useInView, useReducedMotion } from "../../lib/hooks";

const CSS = `
.ui-tr { display: inline; }
.ui-tr__piece {
  display: inline-block;
  opacity: 0;
  filter: blur(4px);
  transform: translateY(0.32em);
  transition:
    opacity 620ms var(--ui-ease),
    filter 720ms var(--ui-ease),
    transform 720ms var(--ui-ease);
  will-change: opacity, filter, transform;
}
.ui-tr[data-shown="true"] .ui-tr__piece {
  opacity: 1;
  filter: blur(0);
  transform: none;
}
.ui-tr__word { white-space: pre; }
`;

injectCss("ui-text-reveal", CSS);

export interface TextRevealProps {
  children: string;
  split?: "word" | "letter";
  stagger?: number;
  delay?: number;
  className?: string;
}

export function TextReveal({
  children,
  split = "word",
  stagger = 42,
  delay = 0,
  className,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.25 });
  const pieces = split === "word" ? children.split(/(\s+)/) : children.split("");

  const rendered: ReactNode[] = pieces.map((piece, index) => {
    if (piece === "") return null;
    return (
      <span
        key={`${piece}-${index}`}
        className={cx("ui-tr__piece", split === "word" && "ui-tr__word", piece.trim() === "" && "ui-tr__space")}
        style={{ transitionDelay: `${delay + index * stagger}ms` }}
      >
        {piece === " " ? "\u00A0" : piece}
      </span>
    );
  });

  return (
    <span
      ref={ref}
      className={cx("ui-tr", className)}
      data-shown={reduced || seen ? "true" : undefined}
    >
      {rendered}
    </span>
  );
}
