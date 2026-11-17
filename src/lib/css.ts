/**
 * One-file components carry their own CSS. `injectCss` puts it in the document
 * exactly once per id, so a component can be copied into any React project as
 * a single file (plus this 12-line helper).
 */
const injected = new Set<string>();

export function injectCss(id: string, css: string): void {
  if (typeof document === "undefined" || injected.has(id)) return;
  if (document.querySelector(`style[data-copyui="${id}"]`)) {
    injected.add(id);
    return;
  }
  const tag = document.createElement("style");
  tag.setAttribute("data-copyui", id);
  tag.textContent = css;
  document.head.appendChild(tag);
  injected.add(id);
}
