/** @jest-environment node */

import type { BrowserDriver } from "../tools/browser/driver";
import { createMockBrowserDriver } from "../tools/browser/driver";

describe("browser driver mock (TASK-11)", () => {
  test("TC-01: mock driver conforms to BrowserDriver and can simulate identity + affordances snapshot", async () => {
    const driver: BrowserDriver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
            lang: "en",
            title: "Checkout",
            primaryHeading: "Checkout",
            routeKey: "/checkout",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [
            {
              role: { value: "button" },
              name: { value: "Place order" },
              backendDOMNodeId: 101,
            },
          ],
          describedNodes: [
            {
              node: {
                nodeId: 1,
                backendNodeId: 101,
                localName: "button",
                attributes: ["id", "place-order"],
              },
            },
          ],
        },
      ],
    });

    const snapshot = await driver.snapshot({
      mode: "a11y",
      scope: "document",
      includeHidden: false,
      includeDisabled: true,
    });

    expect(snapshot.page.domain).toBe("example.com");
    expect(snapshot.page.url).toBe("https://example.com/checkout");
    expect(snapshot.axNodes).toHaveLength(1);
    expect(snapshot.describedNodes).toHaveLength(1);
  });

  test("TC-02: mock driver can record/verify invoked actions (click/fill/navigate)", async () => {
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/",
            finalUrl: "https://example.com/",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [],
          describedNodes: [],
        },
      ],
    });

    await driver.act({
      target: { kind: "element", selector: "#place-order" },
      action: { type: "click" },
    });

    await driver.act({
      target: { kind: "element", selector: "#email" },
      action: { type: "fill", value: "pete@example.com" },
    });

    await driver.act({
      target: { kind: "page" },
      action: { type: "navigate", url: "https://example.com/thank-you" },
    });

    expect(driver.getRecordedActions()).toEqual([
      {
        target: { kind: "element", selector: "#place-order" },
        action: { type: "click" },
      },
      {
        target: { kind: "element", selector: "#email" },
        action: { type: "fill", value: "pete@example.com" },
      },
      {
        target: { kind: "page" },
        action: { type: "navigate", url: "https://example.com/thank-you" },
      },
    ]);
  });

  test("TC-03: mock driver can simulate navigation/state changes between observations", async () => {
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/step-1",
            finalUrl: "https://example.com/step-1",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [],
          describedNodes: [],
        },
        {
          page: {
            domain: "example.com",
            url: "https://example.com/step-2",
            finalUrl: "https://example.com/step-2",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [],
          describedNodes: [],
        },
      ],
    });

    const before = await driver.snapshot({
      mode: "a11y",
      scope: "document",
      includeHidden: false,
      includeDisabled: true,
    });
    expect(before.page.url).toBe("https://example.com/step-1");

    await driver.act({
      target: { kind: "page" },
      action: { type: "navigate", url: "https://example.com/step-2" },
    });

    const after = await driver.snapshot({
      mode: "a11y",
      scope: "document",
      includeHidden: false,
      includeDisabled: true,
    });
    expect(after.page.url).toBe("https://example.com/step-2");
  });
});
