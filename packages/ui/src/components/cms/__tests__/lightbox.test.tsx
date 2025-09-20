import { ensureLightboxStyles, initLightbox } from "../lightbox";

describe("lightbox", () => {
  beforeEach(() => {
    // Reset DOM and global flags between tests
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    // @ts-expect-error test cleanup for globals the module sets
    delete (globalThis as any).__pbLightboxReady;
    // @ts-expect-error test cleanup for globals the module sets
    delete (globalThis as any).__pbLightboxStyles;
  });

  it("injects styles once", () => {
    expect(document.getElementById("pb-lightbox-styles")).toBeNull();
    ensureLightboxStyles();
    const first = document.getElementById("pb-lightbox-styles");
    expect(first).toBeTruthy();
    // Call again should not duplicate
    ensureLightboxStyles();
    const all = document.querySelectorAll("#pb-lightbox-styles");
    expect(all.length).toBe(1);
  });

  it("opens on click, navigates with arrows, and closes with Escape", () => {
    initLightbox();

    // Build a grouped gallery with two items
    const root = document.createElement("div");
    root.setAttribute("data-lightbox-root", "g1");
    root.innerHTML = `
      <a href="/one.jpg" data-lightbox data-lightbox-group="g1"><img src="/thumb1.jpg" alt="one" /></a>
      <a href="/two.jpg" data-lightbox data-lightbox-group="g1"><img src="/thumb2.jpg" alt="two" /></a>
    `;
    document.body.appendChild(root);

    // Click first image (delegate handler listens on document)
    const firstImg = root.querySelector("img")!;
    firstImg.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const overlay = document.querySelector<HTMLDivElement>(".pb-lightbox");
    expect(overlay).toBeTruthy();
    expect(overlay!.getAttribute("aria-hidden")).toBe("false");

    const overlayImg = overlay!.querySelector<HTMLImageElement>("img")!;
    expect(overlayImg.src).toContain("/one.jpg");

    // Right arrow → next image
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(overlayImg.src).toContain("/two.jpg");

    // Left arrow → previous image
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(overlayImg.src).toContain("/one.jpg");

    // Escape → closes
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(overlay!.getAttribute("aria-hidden")).toBe("true");
  });

  it("moves focus to the close button on open", () => {
    jest.useFakeTimers();
    initLightbox();

    const root = document.createElement("div");
    root.setAttribute("data-lightbox-root", "g1");
    root.innerHTML = `<a href="/one.jpg" data-lightbox data-lightbox-group="g1"><img src="/thumb1.jpg" alt="one" /></a>`;
    document.body.appendChild(root);

    const img = root.querySelector("img")!;
    img.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Wait for setTimeout(0) focus move
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    const closeBtn = document.querySelector<HTMLButtonElement>(".pb-lightbox-close")!;
    expect(document.activeElement).toBe(closeBtn);
  });

  it("stays within the clicked group when multiple groups exist", () => {
    initLightbox();

    // Two separate groups
    const g1 = document.createElement("div");
    g1.setAttribute("data-lightbox-root", "g1");
    g1.innerHTML = `
      <a href="/a1.jpg" data-lightbox data-lightbox-group="g1"><img src="/a1_t.jpg" alt="a1" /></a>
      <a href="/a2.jpg" data-lightbox data-lightbox-group="g1"><img src="/a2_t.jpg" alt="a2" /></a>
    `;
    const g2 = document.createElement("div");
    g2.setAttribute("data-lightbox-root", "g2");
    g2.innerHTML = `
      <a href="/b1.jpg" data-lightbox data-lightbox-group="g2"><img src="/b1_t.jpg" alt="b1" /></a>
    `;
    document.body.appendChild(g1);
    document.body.appendChild(g2);

    // Open first in group 1
    const firstImg = g1.querySelector("img")!;
    firstImg.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const overlay = document.querySelector<HTMLDivElement>(".pb-lightbox")!;
    const overlayImg = overlay.querySelector<HTMLImageElement>("img")!;
    expect(overlayImg.src).toContain("/a1.jpg");

    // Next → should cycle within group 1 (to a2, not b1)
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(overlayImg.src).toContain("/a2.jpg");

    // Next again → wrap to a1
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(overlayImg.src).toContain("/a1.jpg");
  });
});
