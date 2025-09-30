// packages/ui/src/components/cms/page-builder/timeline.ts
"use client";

type TimelineConfig = {
  trigger?: "load" | "click" | "in-view" | "scroll";
  loop?: boolean;
  name?: string;
  steps?: Array<{
    at?: number;
    duration?: number;
    easing?: string;
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  }>;
};

let initialized = false;
const tracked = new WeakMap<HTMLElement, { cfg: TimelineConfig; playing?: boolean }>();
const cleanupFns: Array<() => void> = [];

function applyStep(el: HTMLElement, s: NonNullable<TimelineConfig["steps"]>[number]) {
  const parts: string[] = [];
  if (typeof s.x === "number" || typeof s.y === "number") {
    const tx = s.x ?? 0;
    const ty = s.y ?? 0;
    parts.push(`translate(${tx}px, ${ty}px)`);
  }
  if (typeof s.scale === "number") parts.push(`scale(${s.scale})`);
  if (typeof s.rotate === "number") parts.push(`rotate(${s.rotate}deg)`);
  if (parts.length > 0) el.style.transform = parts.join(" ");
  if (typeof s.opacity === "number") el.style.opacity = String(s.opacity);
}

function seqPlay(el: HTMLElement, cfg: TimelineConfig) {
  if (!cfg.steps || cfg.steps.length === 0) return;
  const steps = cfg.steps;
  let i = 0;
  const run = () => {
    const s = steps[i];
    const d = Math.max(0, Number(s.duration ?? 0));
    const ease = (s.easing || "") as string;
    if (d > 0) {
      el.style.transitionProperty = /* i18n-exempt -- ABC-123 [ttl=2099-12-31]: CSS property list */ "transform, opacity";
      el.style.transitionDuration = `${d}ms`;
      if (ease) el.style.transitionTimingFunction = ease;
    } else {
      el.style.transitionProperty = "";
      el.style.transitionDuration = "";
      el.style.transitionTimingFunction = "";
    }
    applyStep(el, s);
    i++;
    if (i < steps.length) {
      const delay = d > 0 ? d : 0;
      const id = window.setTimeout(run, delay);
      cleanupFns.push(() => window.clearTimeout(id));
    } else if (cfg.loop) {
      i = 0;
      const id = window.setTimeout(run, Math.max(50, Number(steps[steps.length - 1]?.duration ?? 0)));
      cleanupFns.push(() => window.clearTimeout(id));
    }
  };
  run();
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function scrollBind(el: HTMLElement, cfg: TimelineConfig) {
  if (!cfg.steps || cfg.steps.length === 0) return;
  // Normalize and sort by `at`
  const steps = [...cfg.steps]
    .map((s) => ({ ...s, at: typeof s.at === "number" ? s.at : 0 }))
    .sort((a, b) => (a.at! - b.at!));
  const onScroll = () => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // Compute progress: 0 when bottom off-screen, 1 when top reaches top
    const enter = Math.max(0, Math.min(1, 1 - rect.top / vh));
    const progress = Math.max(0, Math.min(1, enter));
    // Find segment
    let a = steps[0];
    let b = steps[steps.length - 1];
    for (let i = 0; i < steps.length - 1; i++) {
      if (progress >= (steps[i].at as number) && progress <= (steps[i + 1].at as number)) {
        a = steps[i];
        b = steps[i + 1];
        break;
      }
    }
    const span = Math.max(1e-6, (b.at as number) - (a.at as number));
    const t = Math.max(0, Math.min(1, (progress - (a.at as number)) / span));
    const cur = {
      opacity: (typeof a.opacity === "number" || typeof b.opacity === "number") ? lerp(a.opacity ?? 1, b.opacity ?? 1, t) : undefined,
      x: (typeof a.x === "number" || typeof b.x === "number") ? lerp(a.x ?? 0, b.x ?? 0, t) : undefined,
      y: (typeof a.y === "number" || typeof b.y === "number") ? lerp(a.y ?? 0, b.y ?? 0, t) : undefined,
      scale: (typeof a.scale === "number" || typeof b.scale === "number") ? lerp(a.scale ?? 1, b.scale ?? 1, t) : undefined,
      rotate: (typeof a.rotate === "number" || typeof b.rotate === "number") ? lerp(a.rotate ?? 0, b.rotate ?? 0, t) : undefined,
    } as NonNullable<TimelineConfig["steps"]>[number];
    el.style.transitionProperty = ""; // direct drive
    el.style.transitionDuration = "";
    el.style.transitionTimingFunction = "";
    applyStep(el, cur);
  };
  const handler = () => requestAnimationFrame(onScroll);
  window.addEventListener("scroll", handler, { passive: true });
  cleanupFns.push(() => window.removeEventListener("scroll", handler));
  onScroll();
}

export function initTimelines(root?: HTMLElement) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (initialized) return; // single global init is fine
  initialized = true;

  const scan = (scope?: ParentNode) => {
    const container = scope || root || document;
    const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-pb-timeline]"));
    nodes.forEach((el) => {
      if (tracked.has(el)) return;
      let cfg: TimelineConfig | undefined;
      try {
        const raw = el.getAttribute("data-pb-timeline") || "";
        cfg = raw ? (JSON.parse(raw) as TimelineConfig) : undefined;
      } catch {
        cfg = undefined;
      }
      if (!cfg || !cfg.steps || cfg.steps.length === 0) return;
      tracked.set(el, { cfg });
      // Initialize initial state to first step if present and non-scroll
      if (cfg.trigger !== "scroll" && cfg.steps[0]) {
        // Apply starting state without transition
        el.style.transitionProperty = "";
        el.style.transitionDuration = "";
        el.style.transitionTimingFunction = "";
        applyStep(el, cfg.steps[0]);
      }
      if (cfg.trigger === "load") {
        seqPlay(el, cfg);
      } else if (cfg.trigger === "click") {
        const onClick = (e: Event) => {
          if (!(e.target as HTMLElement)?.closest("[data-pb-timeline]")) return;
          seqPlay(el, cfg!);
        };
        el.addEventListener("click", onClick);
        cleanupFns.push(() => el.removeEventListener("click", onClick));
      } else if (cfg.trigger === "in-view") {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              seqPlay(el, cfg!);
              io.unobserve(el);
            }
          }
        }, { threshold: 0.2 });
        io.observe(el);
        cleanupFns.push(() => io.disconnect());
      } else if (cfg.trigger === "scroll") {
        scrollBind(el, cfg);
      }
    });
  };

  // initial scan and mutation observe
  scan();
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n as ParentNode); });
      }
    }
  });
  mo.observe(root || document.body, { childList: true, subtree: true });
  cleanupFns.push(() => mo.disconnect());
}

export function disposeTimelines() {
  for (const fn of cleanupFns.splice(0)) { try { fn(); } catch { /* noop */ } }
  initialized = false;
}
