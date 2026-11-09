import { useState, type MouseEvent } from "react";
import {
  BoltIcon,
  CheckIcon,
  ChevronRightIcon,
  CodeIcon,
  CopyIcon,
  MoonIcon,
  RefreshIcon,
  SparkleIcon,
  SunIcon,
} from "../lib/icons";
import { LIBRARY_CATEGORY, LIBRARY_ITEMS } from "./ComponentStories";
import { detailFor } from "./detailData";

type DetailTab = "preview" | "code";
type CopyTarget = "prompt" | "install" | "code";

function componentName(title: string) {
  return title.replace(/[^a-zA-Z0-9]/g, "").replace(/^AI/, "AI");
}

function exampleCode(slug: string, title: string) {
  const name = componentName(title);
  if (slug === "chat-composer") {
    return `import { ChatComposer } from "@copyui/chat-composer";

export function Example() {
  return (
    <ChatComposer
      placeholder="Start by typing..."
      onSend={(message, details) => {
        console.log(message, details.model);
      }}
    />
  );
}`;
  }
  return `import { ${name} } from "@copyui/${slug}";

export function Example() {
  return <${name} />;
}`;
}

export function ComponentDetailPage({
  slug,
  theme,
  onTheme,
  onBack,
}: {
  slug: string;
  theme: "light" | "dark";
  onTheme: (theme: "light" | "dark") => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("preview");
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const item = LIBRARY_ITEMS.find((entry) => entry.slug === slug);

  if (!item) {
    return (
      <article className="doc doc--missing">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a
            href="/components"
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
          >
            Components
          </a>
          <ChevronRightIcon size={10} />
          <span aria-current="page">Not found</span>
        </nav>
        <header className="doc__header">
          <div className="doc__head">
            <h1 className="doc__title">Component not found</h1>
            <p className="doc__lead">There is no component at /components/{slug}.</p>
          </div>
        </header>
      </article>
    );
  }

  const meta = detailFor(slug, item.note);
  const code = exampleCode(slug, item.title);
  const install = `npm i @copyui/${slug}`;
  const prompt = `Build a ${item.title} using the copyui design system. ${meta.description} Respect the shared tokens, 13px UI scale, hairline borders and the existing component API.`;

  const copy = async (value: string, target: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied((current) => (current === target ? null : current)), 1600);
    } catch {
      setCopied(null);
    }
  };

  const onComponentsClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onBack();
  };

  return (
    <article className="doc" data-component={slug}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/components" onClick={onComponentsClick}>
          Components
        </a>
        <ChevronRightIcon size={10} />
        <span>{LIBRARY_CATEGORY[item.category]}</span>
        <ChevronRightIcon size={10} />
        <span aria-current="page">{item.title}</span>
      </nav>

      <header className="doc__header">
        <div className="doc__head">
          <h1 className="doc__title">{item.title}</h1>
          <p className="doc__lead">{meta.description}</p>
        </div>
        <div className="doc__install">
          <button
            type="button"
            className="doc__install-btn"
            onClick={() => copy(install, "install")}
            aria-label={copied === "install" ? "Install command copied" : "Copy install command"}
          >
            <BoltIcon size={11} />
            <span>{copied === "install" ? "Copied" : "Copy install"}</span>
          </button>
          <code className="doc__install-code">{install}</code>
        </div>
      </header>

      <section className="doc__section doc__section--preview" aria-label={`${item.title} preview`}>
        <div className="preview-bar">
          <div className="preview-tabs" role="tablist" aria-label="Preview mode">
            <button
              type="button"
              role="tab"
              id="preview-tab"
              aria-selected={tab === "preview"}
              aria-controls="component-preview"
              className="preview-tab"
              tabIndex={tab === "preview" ? 0 : -1}
              onClick={() => setTab("preview")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  setTab("code");
                  document.getElementById("code-tab")?.focus();
                }
              }}
            >
              <SparkleIcon size={13} />
              Preview
            </button>
            <button
              type="button"
              role="tab"
              id="code-tab"
              aria-selected={tab === "code"}
              aria-controls="component-preview"
              className="preview-tab"
              tabIndex={tab === "code" ? 0 : -1}
              onClick={() => setTab("code")}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  setTab("preview");
                  document.getElementById("preview-tab")?.focus();
                }
              }}
            >
              <CodeIcon size={13} />
              Code
            </button>
          </div>

          <div className="preview-bar__end">
            <div className="preview-bar__controls" aria-label="Preview appearance">
              <button
                type="button"
                className="preview-control"
                aria-label="Light preview"
                aria-pressed={theme === "light"}
                onClick={() => onTheme("light")}
              >
                <SunIcon size={13} />
              </button>
              <button
                type="button"
                className="preview-control"
                aria-label="Dark preview"
                aria-pressed={theme === "dark"}
                onClick={() => onTheme("dark")}
              >
                <MoonIcon size={13} />
              </button>
              <button
                type="button"
                className="preview-control"
                aria-label="Reset preview"
                onClick={() => setTab("preview")}
              >
                <RefreshIcon size={13} />
              </button>
            </div>
            <button type="button" className="preview-prompt" onClick={() => copy(prompt, "prompt")}>
              {copied === "prompt" ? "Prompt copied" : "Copy prompt"}
            </button>
            <a
              className="preview-tool preview-tool--mcp"
              href="https://www.affectui.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Open affectUI MCP reference"
            >
              MCP
            </a>
            <button
              type="button"
              className="preview-copy"
              onClick={() => copy(tab === "code" ? code : prompt, "code")}
            >
              {copied === "code" ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              {copied === "code" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div
          className={`stage${tab === "code" ? " stage--code" : ""}`}
          id="component-preview"
          role="tabpanel"
          aria-labelledby={tab === "preview" ? "preview-tab" : "code-tab"}
        >
          {tab === "preview" ? (
            <div className="stage__look">
              <div className={`detail-preview detail-preview--${slug}`}>
                {item.detailPreview ?? item.preview}
              </div>
            </div>
          ) : (
            <div className="code-panel">
              <div className="code-panel__bar">
                <span>Example.tsx</span>
                <button type="button" onClick={() => copy(code, "code")}>
                  {copied === "code" ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                  {copied === "code" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="code-panel__pre">
                <code>{code}</code>
              </pre>
            </div>
          )}
        </div>
      </section>

      <section className="doc-api" aria-labelledby="doc-api-title">
        <div className="doc-api__head">
          <span className="doc-api__eyebrow">Reference</span>
          <h2 className="doc-api__title" id="doc-api-title">
            Props &amp; variants
          </h2>
          <p className="doc-api__lead">
            The public surface is small on purpose. Variants change emphasis and state, never the
            design language.
          </p>
        </div>

        <div className="doc-api__grid">
          <div className="doc-props">
            <div className="doc-props__head" aria-hidden="true">
              <span>Prop</span>
              <span>Type</span>
              <span>Default</span>
            </div>
            {meta.props.length ? (
              meta.props.map((prop) => (
                <div className="doc-prop" key={prop.name}>
                  <code className="doc-prop__name">{prop.name}</code>
                  <code className="doc-prop__type">{prop.type}</code>
                  <code className="doc-prop__default">{prop.defaultValue ?? "—"}</code>
                  <p className="doc-prop__desc">{prop.description}</p>
                </div>
              ))
            ) : (
              <p className="doc-props__empty">This surface is composed from primitives and takes no extra props.</p>
            )}
          </div>

          <aside className="doc-aside">
            <h3>Variants</h3>
            <div className="doc-variants">
              {meta.variants.map((variant) => (
                <span key={variant}>{variant}</span>
              ))}
            </div>
            <h3>Install</h3>
            <button type="button" className="doc-aside__install" onClick={() => copy(install, "install")}>
              <code>{install}</code>
              {copied === "install" ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            </button>
            <span className="doc-aside__note">
              One React file. Styles live with the component; tokens can be replaced without editing
              the component.
            </span>
          </aside>
        </div>
      </section>
    </article>
  );
}
