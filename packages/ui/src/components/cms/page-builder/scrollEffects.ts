// packages/ui/src/components/cms/page-builder/scrollEffects.ts
"use client";

let stylesInjected = false;
const STYLE_ID = "pb-scroll-effects";
let animInjected = false;
const ANIM_ID = "pb-animations";

export function ensureScrollStyles() {
  if (typeof document === "undefined" || stylesInjected) return;
  if (document.getElementById(STYLE_ID)) {
    stylesInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
/* Reveal helpers: initial state is hidden; script toggles to visible */
[data-pb-reveal] { opacity: 0; transform: translateY(8px); transition-property: opacity, transform; }
.pb-revealed { opacity: 1 !important; transform: none !important; }

/* Sticky helpers */
[data-pb-sticky="top"] { position: sticky; top: var(--pb-sticky-offset, 0px); }
[data-pb-sticky="bottom"] { position: sticky; bottom: var(--pb-sticky-offset, 0px); }

/* Hover effects wrapper */
[data-pb-hover] { position: relative; }
[data-pb-hover] .pb-hover-target {
  transition: transform 200ms ease, opacity 200ms ease;
  transform-origin: center center;
  /* Respect any static transform overrides */
  transform: var(--pb-static-transform, none);
}
[data-pb-hover]:hover .pb-hover-target {
  transform: var(--pb-static-transform, none) scale(var(--pb-hover-scale, 1));
  opacity: var(--pb-hover-opacity, 1);
}
`;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function ensureAnimationStyles() {
  if (typeof document === "undefined" || animInjected) return;
  if (document.getElementById(ANIM_ID)) {
    animInjected = true;
    return;
  }
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
@keyframes pb-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pb-slide { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-up { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-down { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-left { from { transform: translateX(1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes pb-slide-right { from { transform: translateX(-1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes pb-zoom { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pb-rotate { from { transform: rotate(-8deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
.pb-animate { animation-duration: var(--pb-anim-duration, .5s); animation-delay: var(--pb-anim-delay, 0s); animation-timing-function: var(--pb-anim-ease, ease); animation-fill-mode: both; will-change: transform, opacity; }
.pb-animate-fade { animation-name: pb-fade; }
.pb-animate-slide { animation-name: pb-slide; }
.pb-animate-slide-up { animation-name: pb-slide-up; }
.pb-animate-slide-down { animation-name: pb-slide-down; }
.pb-animate-slide-left { animation-name: pb-slide-left; }
.pb-animate-slide-right { animation-name: pb-slide-right; }
.pb-animate-zoom { animation-name: pb-zoom; }
.pb-animate-rotate { animation-name: pb-rotate; }
`;
  document.head.appendChild(style);
  animInjected = true;
}

type ParallaxEl = {
  el: HTMLElement;
  factor: number;
  baseY: number;
};

let initialized = false;
const cleanupFns: Array<() => void> = [];

export function initScrollEffects(root?: HTMLElement) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  ensureScrollStyles();
  if (initialized) return; // single init is sufficient for page
  initialized = true;

  const parallaxEls: ParallaxEl[] = [];

  const setRevealInitial = (el: HTMLElement) => {
    const duration = (el.getAttribute("data-pb-duration") || "").trim();
    const delay = (el.getAttribute("data-pb-delay") || "").trim();
    const ease = (el.getAttribute("data-pb-ease") || "").trim();
    if (duration) el.style.transitionDuration = `${Number(duration)}ms`;
    if (delay) el.style.transitionDelay = `${Number(delay)}ms`;
    if (ease) el.style.transitionTimingFunction = ease;

    // Set directional offset based on type for initial hidden state
    const type = (el.getAttribute("data-pb-reveal") || "fade").trim();
    if (type === "fade") {
      el.style.opacity = "0";
    } else if (type === "slide-up") {
      el.style.transform = "translateY(12px)";
      el.style.opacity = "0";
    } else if (type === "slide-down") {
      el.style.transform = "translateY(-12px)";
      el.style.opacity = "0";
    } else if (type === "slide-left") {
      el.style.transform = "translateX(12px)";
      el.style.opacity = "0";
    } else if (type === "slide-right") {
      el.style.transform = "translateX(-12px)";
      el.style.opacity = "0";
    } else if (type === "zoom") {
      el.style.transform = "scale(0.98)";
      el.style.opacity = "0";
    } else if (type === "rotate") {
      el.style.transform = "rotate(-4deg)";
      el.style.opacity = "0";
    } else {
      // default fade
      el.style.opacity = "0";
    }
  };

  // Guard for test/SSR where IntersectionObserver may be missing
  const hasIO = typeof (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver !== "undefined";
  const revealObserver = hasIO
    ? new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              el.classList.add("pb-revealed");
              el.style.opacity = ""; // allow class to control
              el.style.transform = "";
              observer.unobserve(el);
            }
          }
        },
        { threshold: 0.2 }
      )
    : null;

  const scan = (scope?: ParentNode) => {
    const container: ParentNode = scope || root || document;

    // Reveal targets
    const revealNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pb-reveal]")
    );
    for (const el of revealNodes) {
      if (el.classList.contains("pb-revealed")) continue;
      setRevealInitial(el);
      if (revealObserver) {
        revealObserver.observe(el);
      } else {
        // Fallback: reveal immediately when IntersectionObserver is unavailable
        el.classList.add("pb-revealed");
        el.style.opacity = "";
        el.style.transform = "";
      }
    }

    // Parallax targets
    const pNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pb-parallax]")
    );
    for (const el of pNodes) {
      const factor = Number(el.getAttribute("data-pb-parallax")) || 0.2;
      const rect = el.getBoundingClientRect();
      const baseY = rect.top + window.scrollY;
      parallaxEls.push({ el, factor, baseY });
    }

    // Sticky offset vars
    const sNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pb-sticky-offset]")
    );
    for (const el of sNodes) {
      const offset = (el.getAttribute("data-pb-sticky-offset") || "0").trim();
      el.style.setProperty("--pb-sticky-offset", /px|%|rem|em/.test(offset) ? offset : `${Number(offset)}px`);
    }

    // Stagger children for simple timelines
    const staggerNodes = Array.from(container.querySelectorAll<HTMLElement>("[data-pb-stagger]"));
    for (const el of staggerNodes) {
      const base = Number(el.getAttribute("data-pb-stagger")) || 0;
      if (base <= 0) continue;
      const children = Array.from(el.children) as HTMLElement[];
      children.forEach((child, idx) => {
        try {
          const delay = base * idx;
          if (child.style)
            child.style.transitionDelay = `${delay}ms`;
        } catch { /* noop */ }
      });
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const viewportTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      for (const p of parallaxEls) {
        const dist = p.baseY - viewportTop - viewportHeight / 2;
        const translate = -dist * p.factor * 0.1; // small, subtle
        p.el.style.transform = `translateY(${translate.toFixed(2)}px)`;
      }
      ticking = false;
    });
  };

  const onResize = () => {
    // Recompute baseY for parallax elements
    for (const p of parallaxEls) {
      const rect = p.el.getBoundingClientRect();
      p.baseY = rect.top + window.scrollY;
    }
    onScroll();
  };

  // Initial scan
  scan();
  onScroll();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  cleanupFns.push(() => window.removeEventListener("scroll", onScroll));
  cleanupFns.push(() => window.removeEventListener("resize", onResize));
  if (revealObserver) {
    cleanupFns.push(() => revealObserver.disconnect());
  }

  // Observe DOM changes to attach effects to new nodes
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan(n as ParentNode);
        });
      }
    }
  });
  mo.observe(root || document.body, { childList: true, subtree: true });
  cleanupFns.push(() => mo.disconnect());

  // Click triggers: scroll-to and open-modal
  const onClick = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest("[data-pb-click]") as HTMLElement | null;
    if (!el) return;
    const action = el.getAttribute("data-pb-click");
    if (!action) return;
    if (action === "scroll-to") {
      e.preventDefault();
      const href = el.getAttribute("data-pb-href") || "";
      const id = href.startsWith("#") ? href.slice(1) : href;
      if (!id) return;
      const dest = document.getElementById(id) || document.querySelector(href);
      if (dest && (dest as any).scrollIntoView) {
        try { (dest as any).scrollIntoView({ behavior: "smooth", block: "start" }); } catch { (dest as any).scrollIntoView(); }
      }
    } else if (action === "open-modal") {
      e.preventDefault();
      const text = el.getAttribute("data-pb-modal") || "";
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.5)";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      const modal = document.createElement("div");
      modal.style.background = "white";
      modal.style.maxWidth = "min(90vw, 640px)";
      modal.style.maxHeight = "80vh";
      modal.style.padding = "16px";
      modal.style.borderRadius = "8px";
      modal.style.overflow = "auto";
      const close = document.createElement("button");
      close.textContent = "×";
      close.setAttribute("aria-label", "Close");
      close.style.position = "absolute";
      close.style.top = "12px";
      close.style.right = "16px";
      close.style.fontSize = "20px";
      close.style.background = "transparent";
      close.style.border = "none";
      close.style.cursor = "pointer";
      const wrap = document.createElement("div");
      wrap.style.position = "relative";
      wrap.style.display = "inline-block";
      wrap.appendChild(close);
      const content = document.createElement("div");
      // Use textContent to avoid injecting unsafe HTML. If needed, can be extended.
      content.textContent = text || "\u00A0";
      wrap.appendChild(content);
      modal.appendChild(wrap);
      overlay.appendChild(modal);
      const destroy = () => {
        try { document.body.removeChild(overlay); } catch { /* noop */ }
        window.removeEventListener("keydown", onKey);
      };
      const onKey = (ke: KeyboardEvent) => { if (ke.key === "Escape") destroy(); };
      overlay.addEventListener("click", (evt) => { if (evt.target === overlay) destroy(); });
      close.addEventListener("click", destroy);
      document.body.appendChild(overlay);
      window.addEventListener("keydown", onKey);
    }
  };
  document.addEventListener("click", onClick);
  cleanupFns.push(() => document.removeEventListener("click", onClick));
}

export function disposeScrollEffects() {
  for (const fn of cleanupFns.splice(0)) {
    try { fn(); } catch { /* noop */ }
  }
  initialized = false;
}
