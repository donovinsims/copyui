import type { CSSProperties, ReactNode } from "react";

export function Specimen({
  name,
  note,
  meta,
  children,
  demoClassName,
  id,
  aside,
}: {
  name: string;
  note?: ReactNode;
  meta?: string[];
  children: ReactNode;
  demoClassName?: string;
  id?: string;
  aside?: ReactNode;
}) {
  return (
    <section className="spec" id={id}>
      <header className="spec__head">
        <div className="spec__head-main">
          <h3 className="spec__name">{name}</h3>
          {note ? <p className="spec__note">{note}</p> : null}
        </div>
        <div className="spec__aside">
          {meta?.map((item) => (
            <span className="spec__tag" key={item}>
              {item}
            </span>
          ))}
          {aside}
        </div>
      </header>
      <div className={`spec__demo ${demoClassName ?? ""}`}>{children}</div>
    </section>
  );
}

export function Row({
  children,
  gap = 8,
  wrap = true,
  align = "center",
  style,
}: {
  children: ReactNode;
  gap?: number;
  wrap?: boolean;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
}) {
  return (
    <div
      className="doc-row"
      style={{ gap, flexWrap: wrap ? "wrap" : "nowrap", alignItems: align, ...style }}
    >
      {children}
    </div>
  );
}

export function Col({
  children,
  gap = 8,
  style,
  className,
}: {
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`doc-col ${className ?? ""}`} style={{ gap, ...style }}>
      {children}
    </div>
  );
}

export function DemoLabel({ children }: { children: ReactNode }) {
  return <span className="doc-demolabel">{children}</span>;
}

export function Snippet({ children, label = "usage.tsx" }: { children: string; label?: string }) {
  return (
    <details className="snippet">
      <summary className="snippet__sum">{label}</summary>
      <pre className="snippet__pre">{children}</pre>
    </details>
  );
}
