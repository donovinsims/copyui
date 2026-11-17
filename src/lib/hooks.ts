import { useEffect, useRef, useState, type RefObject } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useInView<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.35 },
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, options.threshold, options.rootMargin]);

  return [ref, seen];
}

export function useInterval(callback: () => void, delay: number | null): void {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (delay === null) return;
    const id = window.setInterval(() => saved.current(), delay);
    return () => window.clearInterval(id);
  }, [delay]);
}

/** A value that ticks up while `active` and freezes when it stops. */
export function useElapsed(active: boolean): number {
  const [ms, setMs] = useState(0);
  const start = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    start.current = performance.now() - ms;
    let frame = 0;
    const tick = () => {
      setMs(performance.now() - start.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return ms;
}
