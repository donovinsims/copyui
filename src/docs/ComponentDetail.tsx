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
type InstallMode = "cli" | "manual";
type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

function componentName(title: string) {
  return title.replace(/[^a-zA-Z0-9]/g, "");
}

const GUIDE_CARDS = [
  {
    slug: "ai-answer",
    title: "React components for AI chat interfaces",
    note: "What an AI chat UI needs – composer, streaming answers, thinking states, tool calls, citations, message actions – and React components for each.",
  },
  {
    slug: "model-picker",
    title: "Model picker UI: letting users choose an LLM",
    note: "How to design a model picker for an AI product – what to show per model, defaults, reasoning settings, and what happens when a model fails.",
  },
];

function CodeBlock({
  code,
  copyKey,
  copied,
  onCopy,
}: {
  code: string;
  copyKey: string;
  copied: string | null;
  onCopy: (value: string, target: string) => void;
}) {
  const isCopied = copied === copyKey;
  return (
    <div className="code">
      <div className="code__head">
        <span className="code__file">
          <CodeIcon size={13} /> example.tsx
        </span>
        <button type="button" className="code__copy" onClick={() => onCopy(code, copyKey)}>
          {isCopied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code__body">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ComponentDetailPage({
  slug,
  theme,
  onTheme,
  onBack,
  onOpen,
}: {
  slug: string;
  theme: "light" | "dark";
  onTheme: (theme: "light" | "dark") => void;
  onBack: () => void;
  onOpen: (slug: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("preview");
  const [copied, setCopied] = useState<string | null>(null);
  const [installMode, setInstallMode] = useState<InstallMode>("cli");
  const [manager, setManager] = useState<PackageManager>("pnpm");
  const [look, setLook] = useState<"classic" | "clean">("clean");
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

  const meta = detailFor(slug, item.title, item.note, item.category);
  const name = componentName(item.title);
  const code = meta.usage;
  const install = `npm i @copyui/${slug}`;
  const installCommand =
    manager === "npm" ? `npm i @copyui/${slug}` : `${manager} add @copyui/${slug}`;
  const manualInstall = `Copy src/components/ui/${name}.tsx and src/lib/css.ts into your project.`;
  const prompt = `Build a ${item.title} using the copyui design system. ${meta.description} Respect the shared tokens, 13px UI scale, hairline borders and the existing component API.`;
  const related = [
    ...LIBRARY_ITEMS.filter((entry) => entry.slug !== slug && entry.category === item.category),
    ...LIBRARY_ITEMS.filter((entry) => entry.slug !== slug && entry.category !== item.category),
  ].slice(0, 2);

  const copy = async (value: string, target: string) => {
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

  const onRelatedClick = (event: MouseEvent<HTMLAnchorElement>, next: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(next);
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
              <SparkleIcon size={14} />
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
              <CodeIcon size={14} />
              Code
            </button>
          </div>

          <div className="preview-bar__end">
            <div className="preview-bar__controls" aria-label="Preview appearance">
              <div className="preview-style" role="radiogroup" aria-label="Component style">
                <button
                  type="button"
                  role="radio"
                  className="preview-control"
                  aria-label="Classic style"
                  aria-checked={look === "classic"}
                  onClick={() => setLook("classic")}
                >
                  <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
                    <rect x="0.5" y="0.5" width="15" height="13" rx="3.5" fill="currentColor" opacity="0.18" />
                    <rect
                      x="2.5"
                      y="2.5"
                      width="11"
                      height="6.5"
                      rx="2"
                      fill="var(--switch-card, #fff)"
                      stroke="currentColor"
                      strokeOpacity="0.35"
                    />
                    <rect x="9" y="10.4" width="4.5" height="1.6" rx="0.8" fill="currentColor" opacity="0.55" />
                  </svg>
                </button>
                <button
                  type="button"
                  role="radio"
                  className="preview-control"
                  aria-label="Clean style"
                  aria-checked={look === "clean"}
                  onClick={() => setLook("clean")}
                >
                  <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
                    <rect
                      x="1.5"
                      y="1.5"
                      width="13"
                      height="11"
                      rx="2.5"
                      fill="var(--switch-card, #fff)"
                      stroke="currentColor"
                      strokeOpacity="0.55"
                    />
                    <path d="M4 5h6M4 7.6h4" stroke="currentColor" strokeOpacity="0.55" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <span className="preview-sep" aria-hidden="true" />
              <div className="preview-theme" role="radiogroup" aria-label="Preview theme">
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
              </div>
              <span className="preview-sep" aria-hidden="true" />
              <button
                type="button"
                className="preview-control"
                aria-label="Reset preview"
                onClick={() => {
                  setTab("preview");
                  setLook("clean");
                }}
              >
                <RefreshIcon size={13} />
              </button>
            </div>
            <div className="prompt-bar">
              <button
                type="button"
                className="preview-prompt prompt-bar__label"
                onClick={() => copy(prompt, "prompt")}
              >
                {copied === "prompt" ? "Prompt copied" : "Copy prompt"}
              </button>
              <div className="prompt-bar__tools">
                <button
                  type="button"
                  className="preview-tool-icon"
                  aria-label="Copy prompt and open in Claude"
                  onClick={() => copy(prompt, "claude")}
                >
                  <svg viewBox="0 0 24 24" fill="#D97757" aria-hidden="true">
                    <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="preview-tool-icon"
                  aria-label="Copy prompt and open in ChatGPT / Codex"
                  onClick={() => copy(prompt, "chatgpt")}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="preview-tool-icon"
                  aria-label="Copy prompt and open in Cursor"
                  onClick={() => copy(prompt, "cursor")}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="preview-tool-icon"
                  aria-label="Copy prompt and open in v0"
                  onClick={() => copy(prompt, "v0")}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M14.066 6.028v2.22h5.729q.075-.001.148.005l-5.853 5.752a2 2 0 0 1-.024-.309V8.247h-2.353v5.45c0 2.322 1.935 4.222 4.258 4.222h5.675v-2.22h-5.675q-.03 0-.059-.003l5.729-5.629q.006.082.006.166v5.465H24v-5.465a4.204 4.204 0 0 0-4.205-4.205zM0 8.245l8.28 9.266c.839.94 2.396.346 2.396-.914V8.245H8.19v5.44l-4.86-5.44Z" />
                  </svg>
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
              </div>
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
        </div>

        <div
          className={`stage${tab === "code" ? " stage--code" : ""}`}
          data-look={look}
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

      <section className="doc__section">
        <h2 className="doc__h2">When to use</h2>
        <ul className="doc__list">
          {meta.whenToUse.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">When not to use</h2>
        <ul className="doc__list">
          {meta.whenNotToUse.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Installation</h2>
        <p className="doc__p">
          Add {item.title} with the copyui CLI – your project needs React 19 and the design tokens
          imported once – or copy the component file by hand.
        </p>
        <p className="doc__p">Requires React 19.</p>
        <div className="underline-tabs" role="tablist" aria-label="Install method">
          <button
            type="button"
            role="tab"
            aria-selected={installMode === "cli"}
            onClick={() => setInstallMode("cli")}
          >
            CLI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={installMode === "manual"}
            onClick={() => setInstallMode("manual")}
          >
            Manual
          </button>
        </div>
        <div className="install">
          <div className="install__head">
            <div className="pm-tabs" role="tablist" aria-label="Package manager">
              {(["pnpm", "npm", "yarn", "bun"] as PackageManager[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={manager === value}
                  onClick={() => setManager(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="install__copy"
              onClick={() => copy(installMode === "cli" ? installCommand : manualInstall, "install-block")}
            >
              {copied === "install-block" ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              {copied === "install-block" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="install__cmd">
            <code>{installMode === "cli" ? installCommand : manualInstall}</code>
          </pre>
        </div>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Usage</h2>
        <CodeBlock code={code} copyKey="usage" copied={copied} onCopy={copy} />
      </section>

      <section className="doc__section doc__section--examples">
        <h2 className="doc__h2">Examples</h2>
        {slug !== "chat-composer" && (
          <div className="doc__variants-row">
            <span className="doc__variants-label">Variants</span>
            <div className="doc-variants">
              {meta.variants.map((variant) => (
                <span key={variant}>{variant}</span>
              ))}
            </div>
          </div>
        )}
        {meta.examples.map((example, index) => (
          <div className="doc__example" key={example.title}>
            <h3 className="doc__h3">{example.title}</h3>
            <CodeBlock
              code={example.code}
              copyKey={`example-${index}`}
              copied={copied}
              onCopy={copy}
            />
          </div>
        ))}
      </section>

      <section className="doc__section" id="api-reference">
        <h2 className="doc__h2">API reference</h2>
        <h3 className="doc__h3 doc__h3--code">{name}</h3>
        <div className="table-wrap">
          <table className="table table--api">
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {meta.props.map((prop) => (
                <tr key={prop.name}>
                  <td>
                    <code className="token">{prop.name}</code>
                  </td>
                  <td>
                    <code className="token token--muted">{prop.type}</code>
                  </td>
                  <td>
                    <code className="token token--muted">{prop.defaultValue ?? "–"}</code>
                  </td>
                  <td>{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Keyboard interactions</h2>
        <div className="table-wrap">
          <table className="table table--keys">
            <tbody>
              {meta.keyboard.map((row) => (
                <tr key={`${row.keys}-${row.action}`}>
                  <td>
                    <code className="kbd">{row.keys}</code>
                  </td>
                  <td>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Accessibility</h2>
        <ul className="doc__list">
          {meta.accessibility.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Motion</h2>
        <ul className="doc__list">
          {meta.motion.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">Responsive behavior</h2>
        <ul className="doc__list">
          {meta.responsive.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="doc__section">
        <h2 className="doc__h2">{meta.relatedTitle}</h2>
        {meta.relatedTitle === "Guides" ? (
          <div className="related related--guides">
            {GUIDE_CARDS.map((entry) => (
              <a
                key={entry.slug}
                className="related__card"
                href={`/components/${entry.slug}`}
                onClick={(event) => onRelatedClick(event, entry.slug)}
              >
                <span className="related__head">
                  <span className="related__name">{entry.title}</span>
                  <span className="related__cat">Guide</span>
                </span>
                <span className="related__desc">{entry.note}</span>
                <span className="related__arrow">
                  <ChevronRightIcon size={14} />
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="related">
            {related.map((entry) => (
              <a
                key={entry.slug}
                className="related__card"
                href={`/components/${entry.slug}`}
                onClick={(event) => onRelatedClick(event, entry.slug)}
              >
                <div className="related__head">
                  <span>{LIBRARY_CATEGORY[entry.category]}</span>
                  <span>Component</span>
                </div>
                <span className="related__name">{entry.title}</span>
                <p className="related__desc">{entry.note}</p>
                <span className="related__arrow">
                  Read <ChevronRightIcon size={11} />
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <footer className="doc__footer">
        <span>copyui · {LIBRARY_ITEMS.length} components · measured from affectui</span>
        <span>React 19 · CSS variables · no runtime dependencies</span>
      </footer>
    </article>
  );
}
