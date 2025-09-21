// packages/ui/src/components/cms/page-builder/lottie.ts
"use client";

type LottieInstance = any; // from lottie-web

let initialized = false;
const cleanupFns: Array<() => void> = [];
const instances = new WeakMap<HTMLElement, LottieInstance>();

async function loadLottie() {
  const mod = await import("lottie-web");
  return mod.default || (mod as any);
}

function ensureContainer(el: HTMLElement) {
  if (el.querySelector(":scope > .pb-lottie")) return el.querySelector(":scope > .pb-lottie") as HTMLElement;
  const wrap = document.createElement("div");
  wrap.className = "pb-lottie";
  wrap.style.position = "absolute";
  wrap.style.inset = "0";
  wrap.style.pointerEvents = "none";
  // Ensure parent is a positioned container
  const style = getComputedStyle(el);
  if (style.position === "static") {
    el.style.position = "relative";
  }
  el.appendChild(wrap);
  return wrap;
}

export function initLottie(root?: HTMLElement) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (initialized) return;
  initialized = true;

  const scan = async (scope?: ParentNode) => {
    const container = scope || root || document;
    const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-pb-lottie-url]"));
    if (nodes.length === 0) return;
    const lottie = await loadLottie();
    for (const el of nodes) {
      if (instances.has(el)) continue;
      const url = el.getAttribute("data-pb-lottie-url") || "";
      if (!url) continue;
      const autoplay = (el.getAttribute("data-pb-lottie-autoplay") || "").trim() === "1";
      const loop = (el.getAttribute("data-pb-lottie-loop") || "").trim() === "1";
      const speed = Number(el.getAttribute("data-pb-lottie-speed") || "1") || 1;
      const trigger = (el.getAttribute("data-pb-lottie-trigger") || "load").trim();
      const containerEl = ensureContainer(el);
      const inst: LottieInstance = lottie.loadAnimation({
        container: containerEl,
        renderer: "svg",
        loop,
        autoplay: autoplay && trigger !== "scroll",
        path: url,
      });
      try { inst.setSpeed(speed); } catch { /* noop */ }
      instances.set(el, inst);

      if (trigger === "hover") {
        const enter = () => { try { inst.goToAndPlay(0, true); } catch {} };
        const leave = () => { try { inst.stop(); } catch {} };
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        cleanupFns.push(() => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); });
      } else if (trigger === "click") {
        const onClick = () => { try { inst.goToAndPlay(0, true); } catch {} };
        el.addEventListener("click", onClick);
        cleanupFns.push(() => el.removeEventListener("click", onClick));
      } else if (trigger === "in-view") {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              try { inst.goToAndPlay(0, true); } catch {}
              io.unobserve(el);
            }
          }
        }, { threshold: 0.2 });
        io.observe(el);
        cleanupFns.push(() => io.disconnect());
      } else if (trigger === "scroll") {
        const onScroll = () => {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          const progress = Math.max(0, Math.min(1, 1 - rect.top / vh));
          try {
            const total = inst.getDuration(true) || 1; // frames
            inst.goToAndStop(total * progress, true);
          } catch {
            // noop
          }
        };
        const handler = () => requestAnimationFrame(onScroll);
        window.addEventListener("scroll", handler, { passive: true });
        cleanupFns.push(() => window.removeEventListener("scroll", handler));
        onScroll();
      }
    }
  };

  // initial scan and mutations
  void scan();
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => { if (n.nodeType === 1) void scan(n as ParentNode); });
      }
    }
  });
  mo.observe(root || document.body, { childList: true, subtree: true });
  cleanupFns.push(() => mo.disconnect());
}

export function disposeLottie() {
  for (const fn of cleanupFns.splice(0)) { try { fn(); } catch { /* noop */ } }
  initialized = false;
}
