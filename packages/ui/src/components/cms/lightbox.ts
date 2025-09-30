/* Tiny, dependency-free lightbox with grouping and keyboard nav */

declare global {
  var __pbLightboxReady: boolean | undefined;
  var __pbLightboxStyles: boolean | undefined;
}

const STYLE_ID = "pb-lightbox-styles";

export function ensureLightboxStyles() {
  if (typeof document === "undefined" || globalThis.__pbLightboxStyles) return;
  if (document.getElementById(STYLE_ID)) {
    globalThis.__pbLightboxStyles = true;
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
  .pb-lightbox-open { overflow: hidden; }
  .pb-lightbox { position: fixed; inset: 0; z-index: 9999; display: none; align-items: center; justify-content: center; }
  .pb-lightbox[aria-hidden="false"] { display: flex; }
  .pb-lightbox-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.8); }
  .pb-lightbox-content { position: relative; z-index: 1; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; gap: .5rem; }
  .pb-lightbox-content img { max-width: 90vw; max-height: 80vh; object-fit: contain; }
  .pb-lightbox-caption { color: var(--color-fg); font-size: 12px; text-align: center; }
  .pb-lightbox-btn { position: absolute; z-index: 1; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); color: var(--color-fg); border: none; padding: .5rem .75rem; cursor: pointer; border-radius: .25rem; }
  .pb-lightbox-prev { left: 1rem; }
  .pb-lightbox-next { right: 1rem; }
  .pb-lightbox-close { position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.15); color: var(--color-fg); border: none; padding: .25rem .5rem; cursor: pointer; border-radius: .25rem; }
  `;
  document.head.appendChild(style);
  globalThis.__pbLightboxStyles = true;
}

export function initLightbox() {
  if (typeof document === "undefined" || globalThis.__pbLightboxReady) return;
  globalThis.__pbLightboxReady = true;

  ensureLightboxStyles();

  let overlay: HTMLDivElement | null = null;
  let imgEl: HTMLImageElement | null = null;
  let captionEl: HTMLElement | null = null;
  let prevBtn: HTMLButtonElement | null = null;
  let nextBtn: HTMLButtonElement | null = null;
  let closeBtn: HTMLButtonElement | null = null;
  let previouslyFocused: Element | null = null;
  let anchors: HTMLAnchorElement[] = [];
  let index = 0;

  // Optional localized labels provided by host app via <html> attributes
  const docRoot = document.documentElement;
  const LB_PREV = docRoot.getAttribute("data-lightbox-prev-label") || undefined; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — provided by host app
  const LB_NEXT = docRoot.getAttribute("data-lightbox-next-label") || undefined; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const LB_CLOSE = docRoot.getAttribute("data-lightbox-close-label") || undefined; // i18n-exempt -- DS-1234 [ttl=2025-11-30]

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "pb-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.tabIndex = -1;

    const backdrop = document.createElement("div");
    backdrop.className = "pb-lightbox-backdrop";
    backdrop.addEventListener("click", close);

    const figure = document.createElement("figure");
    figure.className = "pb-lightbox-content";
    imgEl = document.createElement("img");
    captionEl = document.createElement("figcaption");
    captionEl.className = "pb-lightbox-caption";
    figure.appendChild(imgEl);
    figure.appendChild(captionEl);

    const GLYPH_PREV = String.fromCharCode(0x2039); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — decorative glyph constant
    prevBtn = document.createElement("button");
    prevBtn.className = "pb-lightbox-btn pb-lightbox-prev"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    if (LB_PREV) prevBtn.setAttribute("aria-label", LB_PREV); // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    prevBtn.textContent = GLYPH_PREV;
    prevBtn.addEventListener("click", prev);

    const GLYPH_NEXT = String.fromCharCode(0x203A); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — decorative glyph constant
    nextBtn = document.createElement("button");
    nextBtn.className = "pb-lightbox-btn pb-lightbox-next"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    if (LB_NEXT) nextBtn.setAttribute("aria-label", LB_NEXT); // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    nextBtn.textContent = GLYPH_NEXT;
    nextBtn.addEventListener("click", next);

    const GLYPH_CLOSE = String.fromCharCode(0x00D7); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — decorative glyph constant
    closeBtn = document.createElement("button");
    closeBtn.className = "pb-lightbox-close";
    if (LB_CLOSE) closeBtn.setAttribute("aria-label", LB_CLOSE); // i18n-exempt: provided by host app
    closeBtn.textContent = GLYPH_CLOSE;
    closeBtn.addEventListener("click", close);

    overlay.appendChild(backdrop);
    overlay.appendChild(figure);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);
  }

  function update() {
    const a = anchors[index];
    if (!a || !imgEl) return;
    const img = a.querySelector("img");
    imgEl.src = a.href;
    imgEl.alt = img?.getAttribute("alt") ?? "";
    if (captionEl) captionEl.textContent = img?.getAttribute("aria-label") || a.getAttribute("aria-label") || "";
  }

  function open(ev: MouseEvent, clicked: HTMLAnchorElement) {
    ev.preventDefault();
    if (!overlay) buildOverlay();
    previouslyFocused = document.activeElement;

    // Group by nearest lightbox root, else by common parent
    const root = clicked.closest("[data-lightbox-root]") ?? clicked.parentElement;
    anchors = root ? Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-lightbox]")) : [clicked];
    index = anchors.indexOf(clicked);
    if (index < 0) index = 0;

    update();
    overlay!.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("pb-lightbox-open");
    // Focus the close button for accessibility
    setTimeout(() => closeBtn?.focus(), 0);
  }

  function close() {
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("pb-lightbox-open");
    (previouslyFocused as HTMLElement | null)?.focus?.();
  }

  function next() {
    if (!anchors.length) return;
    index = (index + 1) % anchors.length;
    update();
  }

  function prev() {
    if (!anchors.length) return;
    index = (index - 1 + anchors.length) % anchors.length;
    update();
  }

  function onKey(e: KeyboardEvent) {
    if (!overlay || overlay.getAttribute("aria-hidden") === "true") return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "Tab") {
      // crude focus trap between close/prev/next
      const focusables = [closeBtn!, prevBtn!, nextBtn!].filter(Boolean) as HTMLElement[];
      const dir = e.shiftKey ? -1 : 1;
      const current = document.activeElement as HTMLElement | null;
      const i = focusables.indexOf(current || closeBtn!);
      const ni = (i + dir + focusables.length) % focusables.length;
      focusables[ni].focus();
      e.preventDefault();
    }
  }

  document.addEventListener("keydown", onKey);
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const a = target?.closest?.("a[data-lightbox]") as HTMLAnchorElement | null;
    if (!a) return;
    open(e as MouseEvent, a);
  });
}
