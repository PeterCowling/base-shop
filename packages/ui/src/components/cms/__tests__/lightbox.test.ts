import { describe, it, expect, beforeEach } from "@jest/globals";
import { ensureLightboxStyles, initLightbox } from "../lightbox";

describe("lightbox DOM helpers", () => {
  beforeEach(() => {
    // reset global flags the module uses
    // @ts-expect-error test shim
    globalThis.__pbLightboxReady = undefined;
    // @ts-expect-error test shim
    globalThis.__pbLightboxStyles = undefined;
    const el = document.getElementById("pb-lightbox-styles");
    el?.remove();
    document.body.innerHTML = "";
  });

  it("injects styles only once (idempotent)", () => {
    ensureLightboxStyles();
    ensureLightboxStyles();
    const style = document.getElementById("pb-lightbox-styles");
    expect(style).toBeTruthy();
    // @ts-expect-error test shim
    expect(globalThis.__pbLightboxStyles).toBe(true);
  });

  it("creates overlay and opens on clicking a lightbox link, then closes on Escape", () => {
    initLightbox();

    const a = document.createElement("a");
    a.setAttribute("data-lightbox", "1");
    a.href = "/img.png";
    const img = document.createElement("img");
    img.setAttribute("alt", "Preview");
    a.appendChild(img);
    document.body.appendChild(a);

    // click should open overlay
    a.click();
    const overlay = document.querySelector<HTMLDivElement>(".pb-lightbox");
    expect(overlay).toBeTruthy();
    expect(overlay!.getAttribute("aria-hidden")).toBe("false");

    // pressing Escape closes it
    const evt = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(evt);
    expect(overlay!.getAttribute("aria-hidden")).toBe("true");
  });
});

