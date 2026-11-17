const host = document.getElementById("shadow-host");
if (host && host.attachShadow) {
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      .shadow-btn { font: 13px system-ui, sans-serif; border: 1px solid #ddd; border-radius: 8px; padding: 6px 10px; background: #fff; }
    </style>
    <button class="shadow-btn" type="button">Shadow action</button>
  `;
}

const clock = document.getElementById("clock");
if (clock) clock.textContent = new Date().toISOString();

for (const button of document.querySelectorAll("[data-tab]")) {
  button.addEventListener("click", () => {
    const selected = button.dataset.tab;
    for (const peer of document.querySelectorAll("[data-tab]")) {
      peer.setAttribute("aria-selected", String(peer === button));
    }
    for (const panel of document.querySelectorAll("#panel-a, #panel-b")) {
      panel.hidden = !panel.id.endsWith(selected);
    }
  });
}

const dialog = document.querySelector("dialog");
document.querySelector("[data-open-dialog]")?.addEventListener("click", () => dialog?.showModal());
document.querySelector("[data-close-dialog]")?.addEventListener("click", () => dialog?.close());

for (const button of document.querySelectorAll('button[aria-label="Light theme"], button[aria-label="Dark theme"]')) {
  button.addEventListener("click", () => {
    const theme = button.getAttribute("aria-label") === "Dark theme" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("fixture-theme", theme);
    } catch {
      /* ignore */
    }
  });
}
