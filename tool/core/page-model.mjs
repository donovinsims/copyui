/**
 * The in-page extractor. It runs inside the browser, so it must be fully
 * self-contained: no imports, no closures, no Node APIs.
 *
 * It returns a JSON-safe model with a flat node list (tree links by index), the
 * named slot views the assertion engine reads, derived collections (cards,
 * sections, tables) and page-level metadata.
 */
export async function extractPageModel(page, options = {}) {
  return page.evaluate(inPageExtractor, options);
}

function inPageExtractor(options) {
  const maxNodes = Number(options.maxNodes) || 12000;
  const ignoredTags = new Set([
    "script",
    "style",
    "noscript",
    "template",
    "meta",
    "link",
    "base",
    "head",
    "title",
  ]);
  const leafTags = new Set(["svg", "canvas", "video", "audio", "iframe", "object", "embed"]);

  const textOf = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const round = (value) => Math.round(Number(value) * 100) / 100;
  const numberOrNull = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const rectOf = (element, offsetX = 0, offsetY = 0) => {
    const rect = element.getBoundingClientRect();
    return {
      x: round(rect.x + offsetX),
      y: round(rect.y + offsetY),
      width: round(rect.width),
      height: round(rect.height),
    };
  };

  const normalizeClasses = (element) => {
    const raw = typeof element.className === "string" ? element.className : element.getAttribute("class") || "";
    return raw
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !/[_-][a-f0-9]{5,}$/i.test(token))
      .filter((token) => !/^css-[a-z0-9]+$/i.test(token))
      .filter((token) => token.length < 48)
      .sort()
      .slice(0, 8)
      .join(" ");
  };

  const roleFor = (element, tag) => {
    const explicit = element.getAttribute("role");
    if (explicit) return explicit;
    if (tag === "input") {
      const type = (element.getAttribute("type") || "text").toLowerCase();
      if (type === "submit" || type === "button" || type === "reset" || type === "image") return "button";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "search") return "searchbox";
      if (type === "range") return "slider";
      return "textbox";
    }
    const map = {
      a: "link",
      button: "button",
      select: "combobox",
      textarea: "textbox",
      img: "img",
      nav: "navigation",
      main: "main",
      header: "banner",
      footer: "contentinfo",
      aside: "complementary",
      form: "form",
      table: "table",
      dialog: "dialog",
      details: "group",
      summary: "button",
      h1: "heading",
      h2: "heading",
      h3: "heading",
      h4: "heading",
      h5: "heading",
      h6: "heading",
      ul: "list",
      ol: "list",
      li: "listitem",
      article: "article",
      section: "region",
    };
    return map[tag] || null;
  };

  const accessibleName = (element) => {
    const labelled = element.getAttribute("aria-label");
    if (labelled) return textOf(labelled).slice(0, 120);
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const joined = textOf(
        labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id))
          .filter(Boolean)
          .map((node) => node.innerText)
          .join(" "),
      );
      if (joined) return joined.slice(0, 120);
    }
    for (const attribute of ["alt", "title", "placeholder", "value"]) {
      const value = element.getAttribute(attribute);
      if (value && typeof value === "string") return textOf(value).slice(0, 120);
    }
    return textOf(element.innerText).slice(0, 120);
  };

  const stylesOf = (element) => {
    const style = getComputedStyle(element);
    return {
      display: style.display,
      position: style.position,
      visibility: style.visibility,
      opacity: numberOrNull(style.opacity),
      color: style.color,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      fontFamily: style.fontFamily,
      fontSize: numberOrNull(style.fontSize),
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      lineHeight: numberOrNull(style.lineHeight),
      letterSpacing: style.letterSpacing,
      textTransform: style.textTransform,
      textAlign: style.textAlign,
      padding: style.padding,
      margin: style.margin,
      gap: style.gap,
      borderWidth: numberOrNull(style.borderTopWidth),
      borderColor: style.borderTopColor,
      borderStyle: style.borderTopStyle,
      radius: numberOrNull(style.borderTopLeftRadius),
      boxShadow: style.boxShadow,
      transform: style.transform,
      filter: style.filter,
      backdropFilter: style.backdropFilter,
      zIndex: style.zIndex === "auto" ? null : numberOrNull(style.zIndex),
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      flexDirection: style.flexDirection,
      flexWrap: style.flexWrap,
      justifyContent: style.justifyContent,
      alignItems: style.alignItems,
      gridTemplateColumns: style.gridTemplateColumns,
      gridTemplateRows: style.gridTemplateRows,
      gridAutoFlow: style.gridAutoFlow,
      width: numberOrNull(style.width),
      height: numberOrNull(style.height),
      maxWidth: style.maxWidth,
      minHeight: style.minHeight,
      objectFit: style.objectFit,
    };
  };

  const slotView = (element, offsetX = 0, offsetY = 0) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      cls: normalizeClasses(element),
      rect: rectOf(element, offsetX, offsetY),
      font: {
        family: style.fontFamily,
        size: numberOrNull(style.fontSize),
        weight: style.fontWeight,
        lineHeight: numberOrNull(style.lineHeight),
        letterSpacing: style.letterSpacing,
      },
      color: style.color,
      background: style.backgroundColor,
      border: {
        width: numberOrNull(style.borderTopWidth),
        color: style.borderTopColor,
      },
      radius: numberOrNull(style.borderTopLeftRadius),
      boxShadow: style.boxShadow,
      display: style.display,
      padding: style.padding,
      margin: style.margin,
      gap: style.gap,
    };
  };

  const deepQueryAll = (selector, root = document, out = []) => {
    if (!selector) return out;
    try {
      out.push(...root.querySelectorAll(selector));
    } catch {
      return out;
    }
    for (const element of root.querySelectorAll("*")) {
      if (element.shadowRoot) deepQueryAll(selector, element.shadowRoot, out);
    }
    return out;
  };
  const deepQuery = (selector, root = document) => deepQueryAll(selector, root)[0] ?? null;

  const collectFontFaces = () => {
    const faces = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list) => {
        for (const rule of list) {
          if (rule.type === 5 && rule.style) {
            const src = rule.style.getPropertyValue("src");
            if (src) {
              faces.push({
                family: rule.style.getPropertyValue("font-family").replace(/^["']|["']$/g, ""),
                weight: rule.style.getPropertyValue("font-weight") || null,
                style: rule.style.getPropertyValue("font-style") || null,
                display: rule.style.getPropertyValue("font-display") || null,
                src: src.slice(0, 500),
              });
            }
          } else if (rule.cssRules) {
            walk(rule.cssRules);
          }
        }
      };
      walk(rules);
    }
    return faces.slice(0, 60);
  };

  const collectMediaQueries = () => {
    const queries = new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list) => {
        for (const rule of list) {
          if (rule.conditionText) queries.add(rule.conditionText);
          if (rule.cssRules) walk(rule.cssRules);
        }
      };
      walk(rules);
    }
    return [...queries].sort();
  };

  const nodes = [];
  const totalElements = document.getElementsByTagName("*").length;
  let truncated = false;

  const addNode = (element, parent, depth, offsetX, offsetY, frame) => {
    if (nodes.length >= maxNodes) {
      truncated = true;
      return -1;
    }
    const tag = element.tagName.toLowerCase();
    const style = getComputedStyle(element);
    const rect = rectOf(element, offsetX, offsetY);
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0;
    const index = nodes.length;
    const ownText = [...element.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join(" ");
    const node = {
      i: index,
      parent,
      depth,
      tag,
      role: roleFor(element, tag),
      name: accessibleName(element),
      text: textOf(ownText || (element.children.length === 0 ? element.innerText : "")).slice(0, 240),
      classes: normalizeClasses(element),
      id: element.id || null,
      frame,
      shadow: Boolean(element.getRootNode()?.host),
      visible,
      rect,
      children: [],
      styles: stylesOf(element),
      attrs: {
        type: element.getAttribute("type") || null,
        href: element.getAttribute("href") || null,
        src: element.getAttribute("src") || null,
        alt: element.getAttribute("alt") || null,
        ariaExpanded: element.getAttribute("aria-expanded") || null,
        ariaCurrent: element.getAttribute("aria-current") || null,
        ariaSelected: element.getAttribute("aria-selected") || null,
        disabled: element.hasAttribute("disabled") || null,
      },
      asset: tag === "img" || tag === "video" || tag === "source" ? element.currentSrc || element.src || null : null,
    };
    nodes.push(node);
    if (parent >= 0) nodes[parent].children.push(index);

    if (leafTags.has(tag)) {
      if (tag === "iframe") {
        try {
          const doc = element.contentDocument;
          if (doc?.documentElement) {
            const nextFrame = frame ? `${frame}/iframe` : "iframe";
            walk(doc.documentElement, index, depth + 1, offsetX + rect.x, offsetY + rect.y, nextFrame);
          }
        } catch {
          /* cross-origin iframes are intentionally not traversed */
        }
      }
      return index;
    }

    if (element.shadowRoot) {
      for (const child of element.shadowRoot.children) {
        walk(child, index, depth + 1, offsetX, offsetY, frame);
      }
    }
    for (const child of element.children) {
      walk(child, index, depth + 1, offsetX, offsetY, frame);
    }
    return index;
  };

  const walk = (element, parent, depth, offsetX, offsetY, frame) => {
    if (!element || element.nodeType !== 1) return;
    const tag = element.tagName.toLowerCase();
    if (ignoredTags.has(tag)) return;
    addNode(element, parent, depth, offsetX, offsetY, frame);
  };

  const rootElement = document.documentElement;
  if (rootElement) walk(rootElement, -1, 0, 0, 0, null);

  const slots = {};
  for (const [name, selector] of Object.entries(options.slots ?? {})) {
    slots[name] = slotView(deepQuery(selector));
  }

  const derived = {};
  const config = options.derived ?? {};

  if (config.cards) {
    const cards = deepQueryAll(config.cards);
    derived.cards = {
      count: cards.length,
      rects: cards.slice(0, 24).map((card) => rectOf(card)),
    };
    const gridElement = config.grid ? deepQuery(config.grid) : cards[0]?.parentElement;
    if (gridElement) {
      const gridStyle = getComputedStyle(gridElement);
      derived.grid = {
        ...slotView(gridElement),
        columns: gridStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        gap: gridStyle.gap,
        gapPx: Number.parseFloat(gridStyle.gap) || 0,
      };
    } else {
      derived.grid = null;
    }
  }

  if (config.sections) {
    const { item, exclude, title = ".doc__h2", padding = "paddingTop" } = config.sections;
    const sections = deepQueryAll(item).filter((element) => !exclude || !element.matches(exclude));
    derived.sections = {
      count: sections.length,
      titles: sections.map((element) => textOf(element.querySelector(title)?.textContent ?? "")),
      paddings: sections.map((element) => getComputedStyle(element)[padding]),
      rects: sections.map((element) => rectOf(element)),
    };
  }

  if (config.activeNav) {
    const element = deepQuery(config.activeNav);
    derived.activeNav = {
      text: element ? textOf(element.textContent) : null,
      current: element?.getAttribute("aria-current") ?? null,
    };
  }

  if (config.toc) derived.tocCount = deepQueryAll(config.toc).length;

  if (config.apiTable) {
    const table = deepQuery(config.apiTable);
    derived.apiRows = table ? table.querySelectorAll("tbody tr").length : 0;
    derived.apiColumns = table ? table.querySelectorAll("thead th").length : 0;
  }

  if (config.related) {
    const element = deepQuery(config.related);
    derived.relatedColumns = element
      ? getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length
      : null;
  }

  const body = document.body;
  const page = {
    url: location.href,
    title: document.title,
    lang: document.documentElement.getAttribute("lang"),
    documentHeight: Math.max(document.documentElement.scrollHeight, body?.scrollHeight ?? 0),
    scrollWidth: Math.max(document.documentElement.scrollWidth, body?.scrollWidth ?? 0),
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    bodyBackground: body ? getComputedStyle(body).backgroundColor : null,
    fonts: [...new Set([...document.fonts].map((font) => `${font.family} ${font.weight} ${font.style}`))].sort(),
    fontFaces: collectFontFaces(),
    mediaQueries: collectMediaQueries(),
    images: deepQueryAll("img")
      .slice(0, 200)
      .map((image) => ({
        src: image.currentSrc || image.src || null,
        alt: image.getAttribute("alt") ?? null,
        width: image.naturalWidth,
        height: image.naturalHeight,
        loading: image.getAttribute("loading") || null,
      })),
    counts: {
      elements: totalElements,
      nodes: nodes.length,
      images: document.images.length,
      links: document.links.length,
      forms: document.forms.length,
      inputs: document.querySelectorAll("input, textarea, select").length,
      canvases: document.querySelectorAll("canvas").length,
      videos: document.querySelectorAll("video").length,
      iframes: document.querySelectorAll("iframe").length,
      shadowHosts: [...document.querySelectorAll("*")].filter((element) => element.shadowRoot).length,
      truncated,
    },
  };

  return { page, nodes, slots, derived };
}
