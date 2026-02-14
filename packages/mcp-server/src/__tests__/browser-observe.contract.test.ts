/** @jest-environment node */

import { bicSchema } from "../tools/browser/bic";
import { createMockBrowserDriver } from "../tools/browser/driver";
import { browserObserve } from "../tools/browser/observe";
import { BrowserSessionStore } from "../tools/browser/session";

describe("browser_observe contract (TASK-06)", () => {
  test("TC-01: observe() on fixture inputs returns BIC with expected page.domain/url/lang/title", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
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

    const session = store.createSession({ driver });

    const result = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 50,
      includeHidden: false,
      includeDisabled: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const parsed = bicSchema.parse(result.value.observation);
    expect(parsed.page.domain).toBe("example.com");
    expect(parsed.page.url).toBe("https://example.com/checkout");
    expect(parsed.page.lang).toBe("en");
    expect(parsed.page.title).toBe("Checkout");
    expect(parsed.affordances).toHaveLength(1);

    const a0 = parsed.affordances[0];
    expect(a0.role).toBe("button");
    expect(a0.name).toBe("Place order");

    const resolved = store.resolveActionTarget({
      sessionId: session.sessionId,
      observationId: parsed.observationId,
      actionId: a0.actionId,
    });

    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value.selector).toBe("#place-order");
      expect(resolved.value.bestEffort).toBe(false);
    }
  });

  test("TC-02: observe() truncates affordances to maxAffordances and returns hasMore=true with nextCursor", async () => {
    const store = new BrowserSessionStore();
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
          axNodes: [
            { role: { value: "button" }, name: { value: "One" }, backendDOMNodeId: 1 },
            { role: { value: "button" }, name: { value: "Two" }, backendDOMNodeId: 2 },
            { role: { value: "button" }, name: { value: "Three" }, backendDOMNodeId: 3 },
          ],
          describedNodes: [
            { node: { nodeId: 1, backendNodeId: 1, localName: "button", attributes: ["id", "one"] } },
            { node: { nodeId: 2, backendNodeId: 2, localName: "button", attributes: ["id", "two"] } },
            { node: { nodeId: 3, backendNodeId: 3, localName: "button", attributes: ["id", "three"] } },
          ],
        },
      ],
    });

    const session = store.createSession({ driver });

    const result = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 2,
      includeHidden: false,
      includeDisabled: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const obs = bicSchema.parse(result.value.observation);
    expect(obs.affordances).toHaveLength(2);
    expect(obs.hasMore).toBe(true);
    expect(typeof obs.nextCursor).toBe("string");
  });

  test("TC-03: when modal open (fixture), modal affordances rank before main", async () => {
    const store = new BrowserSessionStore();
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
            modals: [{ title: "Confirm" }],
            frames: [],
          },
          axNodes: [
            { role: { value: "button" }, name: { value: "Main" }, backendDOMNodeId: 1 },
            { role: { value: "button" }, name: { value: "Modal" }, backendDOMNodeId: 2 },
          ],
          describedNodes: [
            {
              node: {
                nodeId: 1,
                backendNodeId: 1,
                localName: "button",
                attributes: ["id", "main", "data-bic-landmark", "main"],
              },
            },
            {
              node: {
                nodeId: 2,
                backendNodeId: 2,
                localName: "button",
                attributes: ["id", "modal", "data-bic-landmark", "modal"],
              },
            },
          ],
        },
      ],
    });

    const session = store.createSession({ driver });

    const result = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 50,
      includeHidden: false,
      includeDisabled: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const obs = bicSchema.parse(result.value.observation);
    expect(obs.affordances.map((a) => a.name)).toEqual(["Modal", "Main"]);
  });

  test("TC-04: observe({ includeHidden:false }) excludes hidden affordances (fixture)", async () => {
    const store = new BrowserSessionStore();
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
          axNodes: [
            { role: { value: "button" }, name: { value: "Visible" }, backendDOMNodeId: 1 },
            { role: { value: "button" }, name: { value: "Hidden" }, backendDOMNodeId: 2 },
          ],
          describedNodes: [
            { node: { nodeId: 1, backendNodeId: 1, localName: "button", attributes: ["id", "visible"] } },
            { node: { nodeId: 2, backendNodeId: 2, localName: "button", attributes: ["id", "hidden", "hidden", ""] } },
          ],
        },
      ],
    });

    const session = store.createSession({ driver });

    const result = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 50,
      includeHidden: false,
      includeDisabled: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const obs = bicSchema.parse(result.value.observation);
    expect(obs.affordances.map((a) => a.name)).toEqual(["Visible"]);
  });

  test("TC-05: observe cursor paging returns stable ordering within the same fixture state", async () => {
    const store = new BrowserSessionStore();
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
          axNodes: [
            { role: { value: "button" }, name: { value: "One" }, backendDOMNodeId: 1 },
            { role: { value: "button" }, name: { value: "Two" }, backendDOMNodeId: 2 },
            { role: { value: "button" }, name: { value: "Three" }, backendDOMNodeId: 3 },
          ],
          describedNodes: [
            { node: { nodeId: 1, backendNodeId: 1, localName: "button", attributes: ["id", "one"] } },
            { node: { nodeId: 2, backendNodeId: 2, localName: "button", attributes: ["id", "two"] } },
            { node: { nodeId: 3, backendNodeId: 3, localName: "button", attributes: ["id", "three"] } },
          ],
        },
      ],
    });

    const session = store.createSession({ driver });

    const first = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 2,
      includeHidden: false,
      includeDisabled: true,
    });

    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const obs1 = bicSchema.parse(first.value.observation);
    expect(obs1.affordances.map((a) => a.name)).toEqual(["One", "Two"]);
    expect(obs1.hasMore).toBe(true);
    expect(typeof obs1.nextCursor).toBe("string");

    const second = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 2,
      includeHidden: false,
      includeDisabled: true,
      cursor: obs1.nextCursor,
    });

    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }

    const obs2 = bicSchema.parse(second.value.observation);
    expect(obs2.affordances.map((a) => a.name)).toEqual(["Three"]);
    expect(obs2.hasMore).toBe(false);
    expect(obs2.nextCursor).toBeUndefined();
  });
});

