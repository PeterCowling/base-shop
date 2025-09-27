import { ensureScrollStyles, ensureAnimationStyles, initScrollEffects, disposeScrollEffects } from "../scrollEffects";

describe("scrollEffects", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "<div id='root'></div>";
    disposeScrollEffects();
  });

  it("injects base styles and animation styles once", () => {
    ensureScrollStyles();
    ensureScrollStyles();
    ensureAnimationStyles();
    ensureAnimationStyles();
    expect(document.getElementById("pb-scroll-effects")).toBeTruthy();
    expect(document.getElementById("pb-animations")).toBeTruthy();
  });

  it("sets up reveal + parallax + sticky + stagger and cleans up listeners", () => {
    // jsdom lacks IntersectionObserver; provide a minimal stub
    (global as any).IntersectionObserver = class implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "0px";
      readonly thresholds: ReadonlyArray<number> = [0];
      private _callback: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {
        this._callback = cb;
      }
      observe(_: Element): void {}
      unobserve(_: Element): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    } as unknown as IntersectionObserver;
    const root = document.getElementById("root")!;
    const reveal = document.createElement("div");
    reveal.setAttribute("data-pb-reveal", "slide-up");
    root.appendChild(reveal);
    const par = document.createElement("div");
    par.setAttribute("data-pb-parallax", "0.3");
    // stub getBoundingClientRect
    (par as any).getBoundingClientRect = () => ({ top: 100, left: 0, width: 10, height: 10, right: 10, bottom: 110, x: 0, y: 100, toJSON: () => ({}) });
    root.appendChild(par);
    const sticky = document.createElement("div");
    sticky.setAttribute("data-pb-sticky-offset", "12");
    root.appendChild(sticky);
    const stagger = document.createElement("div");
    stagger.setAttribute("data-pb-stagger", "10");
    const child = document.createElement("div"); stagger.appendChild(child);
    root.appendChild(stagger);

    initScrollEffects(root as any);
    // click hooks installed; trigger click actions and ensure no exceptions
    const link = document.createElement("a");
    link.setAttribute("data-pb-click", "scroll-to");
    link.setAttribute("data-pb-href", "#root");
    root.appendChild(link);
    link.click();

    const open = document.createElement("button");
    open.setAttribute("data-pb-click", "open-modal");
    open.setAttribute("data-pb-modal", "Hello");
    root.appendChild(open);
    open.click();
    const overlay = document.body.querySelector("div[style*='position: fixed']");
    expect(overlay).toBeTruthy();
    // close by clicking overlay
    (overlay as HTMLElement).click();

    disposeScrollEffects();
  });
});
