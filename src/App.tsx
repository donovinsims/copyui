import { useEffect, useRef, useState, type ReactNode } from "react";
import "./docs/docs.css";
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
} from "./lib/icons";
import { OverviewPage, FoundationsPage, TokensPage } from "./docs/Docs";
import { ComponentsPage } from "./docs/ComponentStories";
import { ComponentDetailPage } from "./docs/ComponentDetail";
import { MotionPage } from "./docs/MotionStories";
import { PatternsPage } from "./docs/PatternStories";

type PageId = "overview" | "foundations" | "components" | "patterns" | "motion" | "tokens";
type Theme = "light" | "dark";

interface RouteState {
  page: PageId;
  component: string | null;
}

const PAGE_PATHS: Record<PageId, string> = {
  overview: "/",
  foundations: "/foundations",
  tokens: "/tokens",
  components: "/components",
  patterns: "/patterns",
  motion: "/motion",
};

function routeFromPath(pathname: string): RouteState {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = /^\/components\/([^/]+)$/.exec(clean);
  if (match) return { page: "components", component: decodeURIComponent(match[1]!) };
  const entry = (Object.entries(PAGE_PATHS) as Array<[PageId, string]>).find(([, path]) => path === clean);
  return { page: entry?.[0] ?? "overview", component: null };
}

function pathForRoute(route: RouteState) {
  return route.component ? `/components/${route.component}` : PAGE_PATHS[route.page];
}

interface AccentDef {
  id: string;
  label: string;
  value: string;
  ink: string;
  second: string;
}

const ACCENTS: AccentDef[] = [
  { id: "blue", label: "Blueprint", value: "#2f6bff", ink: "#1c50d6", second: "#5e3ee0" },
  { id: "violet", label: "Violet", value: "#6b46e5", ink: "#5232c9", second: "#2f6bff" },
  { id: "emerald", label: "Emerald", value: "#0f9d6a", ink: "#0a7a52", second: "#0e7490" },
  { id: "amber", label: "Amber", value: "#c2751a", ink: "#9a5a10", second: "#d64545" },
  { id: "ink", label: "Ink", value: "#3a3a3f", ink: "#1a1a1e", second: "#6b6b74" },
];

const GITHUB_STARS = "564";

const COMPONENT_LINKS: Array<{ slug: string; label: string }> = [
  { slug: "ai-answer", label: "AI Answer" },
  { slug: "chat-composer", label: "Chat Composer" },
  { slug: "thinking-loader", label: "Thinking Loader" },
  { slug: "message-actions", label: "Message Actions" },
  { slug: "tool-call-card", label: "Tool Call Card" },
  { slug: "model-picker", label: "Model Picker" },
  { slug: "approval-card", label: "Approval Card" },
  { slug: "agent-inbox", label: "Agent Inbox" },
  { slug: "button", label: "Button" },
  { slug: "segmented-control", label: "Segmented Control" },
  { slug: "switch", label: "Switch" },
  { slug: "field", label: "Field" },
  { slug: "card", label: "Card" },
  { slug: "badge", label: "Badge" },
  { slug: "avatar", label: "Avatar" },
  { slug: "tooltip", label: "Tooltip" },
  { slug: "meter", label: "Meter" },
];

const PAGES: Array<{ id: PageId; label: string; icon: ReactNode; group: string; count?: string }> = [
  { id: "overview", label: "Overview", icon: <GridIcon size={14} />, group: "Start" },
  { id: "foundations", label: "Foundations", icon: <LayersIcon size={14} />, group: "Design" },
  { id: "tokens", label: "Tokens", icon: <CodeIcon size={14} />, group: "Design", count: "54" },
  { id: "components", label: "Components", icon: <ShieldIcon size={14} />, group: "Library", count: "17" },
  { id: "patterns", label: "Patterns", icon: <SparkleIcon size={14} />, group: "Library", count: "3" },
  { id: "motion", label: "Motion", icon: <WandIcon size={14} />, group: "Library", count: "7" },
];

const GROUPS = ["Start", "Design", "Library"];

export function App() {
  const [route, setRoute] = useState<RouteState>(() => routeFromPath(window.location.pathname));
  const page = route.page;
  const isDetail = page === "components" && Boolean(route.component);
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [navOpen, setNavOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const navSearchRef = useRef<HTMLInputElement>(null);
  const accent = ACCENTS[0]!;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("copyui-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

  const visibleComponents = COMPONENT_LINKS.filter((entry) =>
    entry.label.toLowerCase().includes(navQuery.trim().toLowerCase()),
  );

  const navigate = (next: RouteState) => {
    const path = pathForRoute(next);
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setRoute(next);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openComponent = (slug: string) => {
    navigate({ page: "components", component: slug });
  };

  return (
    <div
      className={`ds ${isDetail ? "ds--detail" : page === "overview" ? "ds--home" : "ds--docs"}${
        navOpen ? " ds--nav-open" : ""
      }`}
    >
      <aside className="ds__side" id="sidebar">
        <div className="ds__brand">
          <span className="ds__mark" aria-hidden="true">
            c
          </span>
          <span className="ds__wordmark">copyui</span>
        </div>

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

        {GROUPS.map((group) => (
          <nav className="ds__nav-group" key={group} aria-label={group}>
            <span className="ds__nav-label">{group}</span>
            {PAGES.filter((entry) => entry.group === group).map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="ds__nav-item"
                aria-current={page === entry.id ? "page" : undefined}
                onClick={() => navigate({ page: entry.id, component: null })}
              >
                {entry.icon}
                <span>{entry.label}</span>
                {entry.count ? <span className="ds__nav-count">{entry.count}</span> : null}
              </button>
            ))}
          </nav>
        ))}

        <nav className="ds__nav-group ds__nav-group--components" aria-label="Components">
          <span className="ds__nav-label">Components</span>
          {visibleComponents.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              className="ds__nav-item ds__nav-item--sub"
              aria-current={route.component === entry.slug ? "page" : undefined}
              onClick={() => openComponent(entry.slug)}
            >
              <span>{entry.label}</span>
            </button>
          ))}
          {visibleComponents.length === 0 ? <span className="ds__search-empty">No components found.</span> : null}
        </nav>

        <div className="ds__side-foot">
          <span className="ds__side-note">
            Clean-room recreation of the affectUI design language. Tokens measured from the live site;
            no source copied.
          </span>
          <a className="ds__side-link" href="https://www.affectui.com" target="_blank" rel="noreferrer">
            Original <ChevronRightIcon size={11} />
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
                onClick={() => setTheme("light")}
              >
                <SunIcon size={13} />
              </button>
              <button
                type="button"
                className="ds__theme-opt"
                aria-pressed={theme === "dark"}
                aria-label="Dark theme"
                onClick={() => setTheme("dark")}
              >
                <MoonIcon size={13} />
              </button>
            </div>
            <a
              className="ds__gh"
              href="https://github.com/donovinsims/copyui"
              target="_blank"
              rel="noreferrer"
              aria-label={`GitHub · ${GITHUB_STARS} stars`}
            >
              <GithubIcon size={13} />
              <span>{GITHUB_STARS}</span>
            </a>
            <a
              className="ds__pro"
              href="https://www.affectui.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Open affectUI Get Pro"
            >
              <BoltIcon size={10} /> Get Pro
            </a>
            <a className="ds__login" href="https://www.affectui.com" target="_blank" rel="noreferrer">
              Log In
            </a>
          </div>
        </header>

        <main className={`ds__content${isDetail ? " ds__content--doc" : ""}`} id="content">
          {page === "overview" ? (
            <OverviewPage
              onBrowse={() => navigate({ page: "components", component: null })}
              onTokens={() => navigate({ page: "tokens", component: null })}
            />
          ) : null}
          {page === "foundations" ? <FoundationsPage accent={accent} /> : null}
          {page === "components" ? (
            isDetail && route.component ? (
              <ComponentDetailPage
                slug={route.component}
                theme={theme}
                onTheme={setTheme}
                onBack={() => navigate({ page: "components", component: null })}
              />
            ) : (
              <ComponentsPage onOpenComponent={openComponent} />
            )
          ) : null}
          {page === "patterns" ? (
            <PatternsPage onComponents={() => navigate({ page: "components", component: null })} />
          ) : null}
          {page === "motion" ? <MotionPage /> : null}
          {page === "tokens" ? <TokensPage /> : null}

          <footer className="doc-footer">
            <div>
              <strong>copyui</strong> — a repeatable system, not a snapshot.
            </div>
            <div className="doc-footer__meta">
              Inter · React 19 · CSS variables · no Tailwind · no animation library
            </div>
          </footer>
        </main>
        </div>
      </div>
    </div>
  );
}
