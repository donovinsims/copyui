"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoltIcon,
  ChevronRightIcon,
  CodeIcon,
  GithubIcon,
  GridIcon,
  LayersIcon,
  MoonIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  SunIcon,
  WandIcon,
} from "../lib/icons";
import { LIBRARY_ITEMS } from "../docs/ComponentStories";
import { useTheme, type Theme } from "./theme";

type PageId = "overview" | "foundations" | "components" | "patterns" | "motion" | "tokens";

const PAGE_PATHS: Record<PageId, string> = {
  overview: "/",
  foundations: "/foundations",
  tokens: "/tokens",
  components: "/components",
  patterns: "/patterns",
  motion: "/motion",
};

const GITHUB_STARS = "564";

const NPM = "npm";

function activePage(pathname: string): { page: PageId; component: string | null } {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = /^\/components\/([^/]+)$/.exec(clean);
  if (match) return { page: "components", component: decodeURIComponent(match[1]!) };
  const entry = (Object.entries(PAGE_PATHS) as Array<[PageId, string]>).find(([, path]) => path === clean);
  return { page: entry?.[0] ?? "overview", component: null };
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { page, component } = activePage(pathname);
  const isHome = page === "overview";
  const isDetail = page === "components" && Boolean(component);
  const { theme, setTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const navSearchRef = useRef<HTMLInputElement>(null);

  const pages: Array<{ id: PageId; label: string; icon: ReactNode; group: string; count?: string }> = [
    { id: "overview", label: "Overview", icon: <GridIcon size={14} />, group: "Start" },
    { id: "foundations", label: "Foundations", icon: <LayersIcon size={14} />, group: "Design" },
    { id: "tokens", label: "Tokens", icon: <CodeIcon size={14} />, group: "Design", count: "54" },
    {
      id: "components",
      label: "Components",
      icon: <ShieldIcon size={14} />,
      group: "Library",
      count: String(LIBRARY_ITEMS.length),
    },
    { id: "patterns", label: "Patterns", icon: <SparkleIcon size={14} />, group: "Library", count: "3" },
    { id: "motion", label: "Motion", icon: <WandIcon size={14} />, group: "Library", count: "7" },
  ];

  const groups = ["Start", "Design", "Library"];

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setNavOpen(true);
        navSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = navQuery.trim().toLowerCase();
  const visibleComponents = LIBRARY_ITEMS.filter((entry) => entry.title.toLowerCase().includes(query));

  const chooseTheme = (next: Theme) => setTheme(next);

  return (
    <div
      className={`ds ${isDetail ? "ds--detail" : isHome ? "ds--home" : "ds--docs"}${
        navOpen ? " ds--nav-open" : ""
      }`}
    >
      <aside className="ds__side" id="sidebar">
        <Link className="ds__brand" href="/">
          <span className="ds__mark" aria-hidden="true">
            c
          </span>
          <span className="ds__wordmark">copyui</span>
        </Link>

        <label className="ds__search">
          <SearchIcon size={13} />
          <input
            ref={navSearchRef}
            value={navQuery}
            onChange={(event) => setNavQuery(event.target.value)}
            placeholder="Search…"
            aria-label="Search components"
          />
          <span className="ds__search-keys" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </span>
        </label>

        {groups.map((group) => (
          <nav className="ds__nav-group" key={group} aria-label={group}>
            <span className="ds__nav-label">{group}</span>
            {pages
              .filter((entry) => entry.group === group)
              .map((entry) => (
                <Link
                  key={entry.id}
                  href={PAGE_PATHS[entry.id]}
                  className="ds__nav-item"
                  aria-current={page === entry.id ? "page" : undefined}
                  onClick={() => setNavOpen(false)}
                >
                  {entry.icon}
                  <span>{entry.label}</span>
                  {entry.count ? <span className="ds__nav-count">{entry.count}</span> : null}
                </Link>
              ))}
          </nav>
        ))}

        <nav className="ds__nav-group ds__nav-group--components" aria-label="Components">
          <span className="ds__nav-label">Components</span>
          {visibleComponents.map((entry) => (
            <Link
              key={entry.slug}
              href={`/components/${entry.slug}`}
              className="ds__nav-item ds__nav-item--sub"
              aria-current={component === entry.slug ? "page" : undefined}
              onClick={() => setNavOpen(false)}
            >
              <span>{entry.title}</span>
            </Link>
          ))}
          {visibleComponents.length === 0 ? <span className="ds__search-empty">No components found.</span> : null}
        </nav>

        <div className="ds__side-foot">
          <span className="ds__side-note">
            An owned design system: tokens, self-contained React components and a shadcn registry served by
            this app.
          </span>
          <a className="ds__side-link" href="https://www.affectui.com" target="_blank" rel="noreferrer">
            Design-language reference <ChevronRightIcon size={11} />
          </a>
        </div>
      </aside>

      {navOpen ? (
        <button
          type="button"
          className="ds__scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className="ds__main">
        <div className="ds__panel">
          <header className="ds__top">
            <button
              type="button"
              className="ds__menu"
              aria-label={navOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={navOpen}
              aria-controls="sidebar"
              onClick={() => setNavOpen((value) => !value)}
            >
              <span className="ds__menu-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
            <span className="ds__mobile-brand" aria-hidden="true">
              copyui
            </span>

            <div className="ds__top-actions">
              <div className="ds__theme-btn" role="group" aria-label="Theme">
                <button
                  type="button"
                  className="ds__theme-opt"
                  aria-pressed={theme === "light"}
                  aria-label="Light theme"
                  onClick={() => chooseTheme("light")}
                >
                  <SunIcon size={13} />
                </button>
                <button
                  type="button"
                  className="ds__theme-opt"
                  aria-pressed={theme === "dark"}
                  aria-label="Dark theme"
                  onClick={() => chooseTheme("dark")}
                >
                  <MoonIcon size={13} />
                </button>
              </div>
              <Link className="ds__gh" href="/components" aria-label={`Browse ${LIBRARY_ITEMS.length} components`}>
                <BoltIcon size={11} />
                <span>{LIBRARY_ITEMS.length} components</span>
              </Link>
              <a
                className="ds__login"
                href="https://github.com/donovinsims/copyui"
                target="_blank"
                rel="noreferrer"
                aria-label={`copyui on GitHub · ${GITHUB_STARS} stars`}
              >
                <GithubIcon size={13} />
                <span>{GITHUB_STARS}</span>
              </a>
            </div>
          </header>

          <main className={`ds__content${isDetail ? " ds__content--doc" : ""}`} id="content">
            {children}

            <footer className="doc-footer">
              <div>
                <strong>copyui</strong> — a repeatable system, not a snapshot.
              </div>
              <div className="doc-footer__meta">
                Inter · React 19 · CSS variables · no Tailwind · no animation library ·{" "}
                <code>{NPM} run registry:build</code>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
