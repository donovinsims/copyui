"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";

const CSS = `
.ui-bx {
  position: relative;
  transition: height var(--ui-dur-morph) var(--ui-ease-morph);
  overflow: hidden;
}
.ui-bx__layer { transition: opacity 240ms var(--ui-ease), filter 300ms var(--ui-ease), transform 380ms var(--ui-ease-morph); }
.ui-bx__layer[data-state="out"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  filter: blur(5px);
  transform: scale(0.99);
  pointer-events: none;
}
.ui-bx__layer[data-state="in"] { animation: ui-bx-in 380ms var(--ui-ease-morph); }
@keyframes ui-bx-in {
  from { opacity: 0; filter: blur(5px); transform: translateY(3px); }
  to { opacity: 1; filter: blur(0); transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-bx, .ui-bx__layer { transition: none; }
  .ui-bx__layer[data-state="in"] { animation: none; }
}
`;

injectCss("ui-blur-crossfade", CSS);

export interface BlurCrossfadeProps {
  children: ReactNode;
  className?: string;
  contentKey?: string | number;
}

export function BlurCrossfade({ children, className, contentKey }: BlurCrossfadeProps) {
  const [layers, setLayers] = useState<Array<{ id: number; node: ReactNode }>>([
    { id: 0, node: children },
  ]);
  const [height, setHeight] = useState<number | "auto">("auto");
  const current = useRef<HTMLDivElement | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      if (contentKey !== undefined) {
        if (last && last.id === Number(contentKey)) return prev;
      } else if (last && last.node === children) {
        return prev;
      }
      counter.current += 1;
      const id = contentKey !== undefined ? Number(contentKey) : counter.current;
      return [{ id, node: children }];
    });
  }, [children, contentKey]);

  useLayoutEffect(() => {
    const node = current.current;
    if (!node) return;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layers, children]);

  return (
    <div className={cx("ui-bx", className)} style={{ height }}>
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          ref={index === layers.length - 1 ? current : undefined}
          className="ui-bx__layer"
          data-state={index === layers.length - 1 ? "in" : "out"}
          aria-hidden={index === layers.length - 1 ? undefined : true}
        >
          {layer.node}
        </div>
      ))}
    </div>
  );
}
