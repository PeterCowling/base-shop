/** @jest-environment node */

import { BrowserSessionStore } from "../tools/browser/session";

function createNoopDriver() {
  return {
    close: async () => {},
  };
}

describe("browser session store", () => {
  test("TC-01: stale observationId is rejected", async () => {
    const store = new BrowserSessionStore();
    const session = store.createSession({ driver: createNoopDriver() });

    store.setCurrentObservationId(session.sessionId, "obs_001");

    const result = store.assertFreshObservation({
      sessionId: session.sessionId,
      observationId: "obs_000",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STALE_OBSERVATION");
    }
  });

  test("TC-02: close disposes session and future access returns SESSION_NOT_FOUND", async () => {
    const store = new BrowserSessionStore();
    const session = store.createSession({ driver: createNoopDriver() });

    const closed = await store.closeSession(session.sessionId);
    expect(closed.ok).toBe(true);

    const fetched = store.getSession(session.sessionId);
    expect(fetched).toBeNull();

    const result = store.assertFreshObservation({
      sessionId: session.sessionId,
      observationId: "obs_001",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SESSION_NOT_FOUND");
    }
  });

  test("TC-03: multiple sessions keep independent observation epochs", async () => {
    const store = new BrowserSessionStore();
    const sessionA = store.createSession({ driver: createNoopDriver() });
    const sessionB = store.createSession({ driver: createNoopDriver() });

    store.setCurrentObservationId(sessionA.sessionId, "obs_a");
    store.setCurrentObservationId(sessionB.sessionId, "obs_b");

    const okA = store.assertFreshObservation({
      sessionId: sessionA.sessionId,
      observationId: "obs_a",
    });
    expect(okA.ok).toBe(true);

    const okB = store.assertFreshObservation({
      sessionId: sessionB.sessionId,
      observationId: "obs_b",
    });
    expect(okB.ok).toBe(true);
  });
});

describe("browser session action registry (TASK-10)", () => {
  test("TC-01: set current observation + targets, then resolve actionId -> returns expected target", () => {
    const store = new BrowserSessionStore();
    const session = store.createSession({ driver: createNoopDriver() });

    store.setCurrentObservation({
      sessionId: session.sessionId,
      observationId: "obs_123",
      actionTargets: {
        a_1: { selector: "#place-order", bestEffort: false },
      },
    });

    const resolved = store.resolveActionTarget({
      sessionId: session.sessionId,
      observationId: "obs_123",
      actionId: "a_1",
    });

    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value).toEqual({ selector: "#place-order", bestEffort: false });
    }
  });

  test("TC-02: resolve unknown actionId -> returns ACTION_NOT_FOUND", () => {
    const store = new BrowserSessionStore();
    const session = store.createSession({ driver: createNoopDriver() });

    store.setCurrentObservation({
      sessionId: session.sessionId,
      observationId: "obs_123",
      actionTargets: {},
    });

    const resolved = store.resolveActionTarget({
      sessionId: session.sessionId,
      observationId: "obs_123",
      actionId: "a_missing",
    });

    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.error.code).toBe("ACTION_NOT_FOUND");
    }
  });

  test("TC-03: resolve with stale observationId -> returns STALE_OBSERVATION", () => {
    const store = new BrowserSessionStore();
    const session = store.createSession({ driver: createNoopDriver() });

    store.setCurrentObservation({
      sessionId: session.sessionId,
      observationId: "obs_current",
      actionTargets: {
        a_1: { selector: "#place-order", bestEffort: false },
      },
    });

    const resolved = store.resolveActionTarget({
      sessionId: session.sessionId,
      observationId: "obs_stale",
      actionId: "a_1",
    });

    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.error.code).toBe("STALE_OBSERVATION");
    }
  });
});
