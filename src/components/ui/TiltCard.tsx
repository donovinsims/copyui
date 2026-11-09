import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { useReducedMotion } from "../../lib/hooks";

const CSS = `
.ui-tilt {
  position: relative;
  perspective: 900px;
  display: block;
  width: 100%;
}
.ui-tilt__inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 520ms var(--ui-ease), box-shadow 520ms var(--ui-ease);
  will-change: transform;
}
.ui-tilt[data-active="true"] .ui-tilt__inner {
  transition: transform 120ms linear, box-shadow 200ms var(--ui-ease);
  box-shadow: var(--ui-shadow-pop);
}
.ui-tilt__glare {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 320ms var(--ui-ease);
  background: radial-gradient(
    240px circle at var(--mx, 50%) var(--my, 50%),
    rgba(255, 255, 255, 0.42),
    rgba(255, 255, 255, 0) 55%
  );
  mix-blend-mode: soft-light;
  z-index: 2;
}
.ui-tilt[data-active="true"] .ui-tilt__glare { opacity: 1; }
:root[data-theme="dark"] .ui-tilt__glare,
.dark .ui-tilt__glare {
  background: radial-gradient(
    240px circle at var(--mx, 50%) var(--my, 50%),
    rgba(255, 255, 255, 0.14),
    rgba(255, 255, 255, 0) 60%
  );
}
`;

injectCss("ui-tilt-card", CSS);

export interface TiltCardProps {
  children: ReactNode;
  max?: number;
  className?: string;
  style?: CSSProperties;
}

export function TiltCard({ children, max = 7, className, style }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  const reset = () => {
    setActive(false);
    const node = ref.current;
    if (node) {
      node.style.setProperty("--mx", "50%");
      node.style.setProperty("--my", "50%");
    }
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--mx", `${x * 100}%`);
    node.style.setProperty("--my", `${y * 100}%`);
    if (node.firstElementChild instanceof HTMLElement) {
      node.firstElementChild.style.transform = `rotateX(${(0.5 - y) * max * 2}deg) rotateY(${(x - 0.5) * max * 2}deg) translateZ(0)`;
    }
    setActive(true);
  };

  return (
    <div
      ref={ref}
      className={cx("ui-tilt", className)}
      data-active={active || undefined}
      style={style}
      onPointerMove={move}
      onPointerLeave={() => {
        reset();
        const inner = ref.current?.firstElementChild;
        if (inner instanceof HTMLElement) inner.style.transform = "";
      }}
    >
      <div className="ui-tilt__inner">
        {children}
        <span className="ui-tilt__glare" aria-hidden="true" />
      </div>
    </div>
  );
}
