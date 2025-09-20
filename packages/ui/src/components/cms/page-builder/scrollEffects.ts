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
let cleanupFns: Array<() => void> = [];

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

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add("pb-revealed");
          el.style.opacity = ""; // allow class to control
          el.style.transform = "";
          revealObserver.unobserve(el);
        }
      }
    },
    { threshold: 0.2 }
  );

  const scan = (scope?: ParentNode) => {
    const container: ParentNode = scope || root || document;

    // Reveal targets
    const revealNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-pb-reveal]")
    );
    for (const el of revealNodes) {
      if (el.classList.contains("pb-revealed")) continue;
      setRevealInitial(el);
      revealObserver.observe(el);
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
  cleanupFns.push(() => revealObserver.disconnect());

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
}

export function disposeScrollEffects() {
  for (const fn of cleanupFns.splice(0)) {
    try { fn(); } catch { /* noop */ }
  }
  initialized = false;
}
