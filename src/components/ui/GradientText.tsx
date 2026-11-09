import type { ReactNode } from "react";
import { injectCss } from "../../lib/css";
import { cx } from "../../lib/utils";
import { useInView } from "../../lib/hooks";

const CSS = `
.ui-grad {
  display: inline-block;
  background-image: linear-gradient(
    100deg,
    var(--ui-accent) 0%,
    var(--accent-2, #5e3ee0) 26%,
    var(--ui-accent) 48%,
    var(--accent-2, #5e3ee0) 74%,
    var(--ui-accent) 100%
  );
  background-size: 260% 100%;
  background-position: 0% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: ui-grad-flow 9s linear infinite;
}
.ui-grad[data-swept="true"] {
  animation:
    ui-grad-sweep 1.6s var(--ui-ease) 1,
    ui-grad-flow 9s linear 1.6s infinite;
}
@keyframes ui-grad-sweep {
  from { background-position: 180% 50%; }
  to { background-position: 0% 50%; }
}
@keyframes ui-grad-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-grad, .ui-grad[data-swept="true"] { animation: none; background-position: 0% 50%; }
}
`;

injectCss("ui-gradient-text", CSS);

export function GradientText({
  children,
  className,
  sweep = true,
}: {
  children: ReactNode;
  className?: string;
  sweep?: boolean;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  return (
    <span ref={ref} className={cx("ui-grad", className)} data-swept={sweep && seen ? "true" : undefined}>
      {children}
    </span>
  );
}
