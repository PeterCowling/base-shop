// packages/ui/src/components/cms/__tests__/lightbox.test.ts
import { ensureLightboxStyles, initLightbox } from "../lightbox";

describe("lightbox", () => {
  beforeEach(() => {
    // reset globals for each test
    // @ts-expect-error test reset
    global.__pbLightboxStyles = false;
    // @ts-expect-error test reset
    global.__pbLightboxReady = false;
    document.body.innerHTML = "";
    const style = document.getElementById("pb-lightbox-styles");
    if (style) style.remove();
  });

  test("ensureLightboxStyles injects a single style element", () => {
    ensureLightboxStyles();
    expect(document.getElementById("pb-lightbox-styles")).toBeTruthy();
    // Subsequent calls do not duplicate
    ensureLightboxStyles();
    expect(document.querySelectorAll("#pb-lightbox-styles")).toHaveLength(1);
  });

  test("initLightbox builds overlay and navigates between grouped anchors", () => {
    document.body.innerHTML = `
      <div data-lightbox-root>
        <a href="/a.jpg" data-lightbox aria-label="A"><img alt="A" /></a>
        <a href="/b.jpg" data-lightbox aria-label="B"><img alt="B" /></a>
      </div>
    `;
    initLightbox();

    const first = document.querySelector<HTMLAnchorElement>("a[data-lightbox]")!;
    first.click();

    const overlay = document.querySelector(".pb-lightbox") as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute("aria-hidden")).toBe("false");

    const caption = document.querySelector(".pb-lightbox-caption") as HTMLElement;
    expect(caption.textContent).toBe("A");

    // Right arrow navigates to next item
    const evt = new KeyboardEvent("keydown", { key: "ArrowRight" });
    document.dispatchEvent(evt);
    expect(caption.textContent).toBe("B");

    // Escape closes
    const esc = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(esc);
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
  });
});

