/** @jest-environment node */

import { browserAct } from "../tools/browser/act";
import { bicSchema } from "../tools/browser/bic";
import { createMockBrowserDriver } from "../tools/browser/driver";
import { browserObserve } from "../tools/browser/observe";
import { BrowserSessionStore } from "../tools/browser/session";

describe("browser_act contract (TASK-07) - safety", () => {
  test("TC-01: danger action without confirm -> returns SAFETY_CONFIRMATION_REQUIRED + nextObservation", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [
            { role: { value: "button" }, name: { value: "Place order" }, backendDOMNodeId: 101 },
          ],
          describedNodes: [
            { node: { nodeId: 1, backendNodeId: 101, localName: "button", attributes: ["id", "place-order"] } },
          ],
        },
      ],
    });
    const session = store.createSession({ driver });

    const observed = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 50,
      includeHidden: false,
      includeDisabled: true,
    });
    expect(observed.ok).toBe(true);
    if (!observed.ok) {
      return;
    }
    const initialObs = bicSchema.parse(observed.value.observation);
    expect(initialObs.affordances).toHaveLength(1);
    const a0 = initialObs.affordances[0];

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: initialObs.observationId,
      target: { kind: "element", actionId: a0.actionId, risk: "danger", label: "Place order" },
      action: { type: "click" },
      confirm: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.error?.code).toBe("SAFETY_CONFIRMATION_REQUIRED");
    expect(result.value.error?.details?.requiredConfirmationText).toBeTruthy();
    expect(driver.getRecordedActions()).toHaveLength(0);

    const next = bicSchema.parse(result.value.nextObservation);
    expect(next.page.domain).toBe("example.com");
  });

  test("TC-02: confirm with correct confirmationText -> action proceeds", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
            loadState: "interactive",
            blockingOverlay: { present: false },
            blockers: [],
            banners: [],
            modals: [],
            frames: [],
          },
          axNodes: [
            { role: { value: "button" }, name: { value: "Place order" }, backendDOMNodeId: 101 },
          ],
          describedNodes: [
            { node: { nodeId: 1, backendNodeId: 101, localName: "button", attributes: ["id", "place-order"] } },
          ],
        },
      ],
    });
    const session = store.createSession({ driver });

    const observed = await browserObserve({
      store,
      sessionId: session.sessionId,
      mode: "a11y",
      scope: "document",
      maxAffordances: 50,
      includeHidden: false,
      includeDisabled: true,
    });
    expect(observed.ok).toBe(true);
    if (!observed.ok) {
      return;
    }
    const initialObs = bicSchema.parse(observed.value.observation);
    const a0 = initialObs.affordances[0];

    const gated = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: initialObs.observationId,
      target: { kind: "element", actionId: a0.actionId, risk: "danger", label: "Place order" },
      action: { type: "click" },
      confirm: false,
    });

    expect(gated.ok).toBe(true);
    if (!gated.ok) {
      return;
    }
    const required = String(gated.value.error?.details?.requiredConfirmationText ?? "");
    expect(required).toBeTruthy();

    const nextObs = bicSchema.parse(gated.value.nextObservation);
    expect(nextObs.affordances).toHaveLength(1);
    const nextActionId = nextObs.affordances[0]?.actionId;
    expect(nextActionId).toBeTruthy();

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: nextObs.observationId,
      target: { kind: "element", actionId: String(nextActionId), risk: "danger", label: "Place order" },
      action: { type: "click" },
      confirm: true,
      confirmationText: required,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.error).toBeUndefined();
    expect(driver.getRecordedActions()).toEqual([
      { target: { kind: "element", selector: "#place-order" }, action: { type: "click" } },
    ]);
  });
});

describe("browser_act contract (TASK-07) - dispatch and errors", () => {
  test("TC-03: stale observationId -> returns STALE_OBSERVATION + nextObservation", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
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
    const session = store.createSession({ driver });

    store.setCurrentObservation({
      sessionId: session.sessionId,
      observationId: "obs_current",
      actionTargets: { a_1: { selector: "#ok", bestEffort: false } },
    });

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: "obs_stale",
      target: { kind: "element", actionId: "a_1", risk: "safe" },
      action: { type: "click" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.error?.code).toBe("STALE_OBSERVATION");
    expect(result.value.nextObservation.observationId).toBeTruthy();
  });

  test("TC-04: navigate action does not require actionId and updates URL (mock driver)", async () => {
    const store = new BrowserSessionStore();
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
    const session = store.createSession({ driver });

    store.setCurrentObservation({ sessionId: session.sessionId, observationId: "obs_1", actionTargets: {} });

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: "obs_1",
      target: { kind: "page" },
      action: { type: "navigate", url: "https://example.com/step-2" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.error).toBeUndefined();
    expect(driver.getRecordedActions()).toEqual([
      { target: { kind: "page" }, action: { type: "navigate", url: "https://example.com/step-2" } },
    ]);
    expect(result.value.nextObservation.page.url).toBe("https://example.com/step-2");
  });

  test("TC-05: expect.urlContains mismatch -> verification.matched=false (still returns nextObservation)", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
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
    const session = store.createSession({ driver });

    store.setCurrentObservation({ sessionId: session.sessionId, observationId: "obs_1", actionTargets: {} });

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: "obs_1",
      target: { kind: "page" },
      action: { type: "navigate", url: "https://example.com/checkout" },
      expect: { urlContains: "/thank-you" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.verification.matched).toBe(false);
    expect(result.value.nextObservation.page.url).toBe("https://example.com/checkout");
  });

  test("TC-06: unknown actionId in current observation -> returns ACTION_NOT_FOUND (still returns nextObservation)", async () => {
    const store = new BrowserSessionStore();
    const driver = createMockBrowserDriver({
      states: [
        {
          page: {
            domain: "example.com",
            url: "https://example.com/checkout",
            finalUrl: "https://example.com/checkout",
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
    const session = store.createSession({ driver });

    store.setCurrentObservation({
      sessionId: session.sessionId,
      observationId: "obs_1",
      actionTargets: {},
    });

    const result = await browserAct({
      store,
      sessionId: session.sessionId,
      observationId: "obs_1",
      target: { kind: "element", actionId: "a_missing", risk: "safe" },
      action: { type: "click" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.error?.code).toBe("ACTION_NOT_FOUND");
    expect(result.value.nextObservation.observationId).toBeTruthy();
  });
});
