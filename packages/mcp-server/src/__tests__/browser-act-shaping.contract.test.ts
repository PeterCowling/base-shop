/** @jest-environment node */

import type { BicObservation } from "../tools/browser/bic";
import { evaluateExpectations } from "../tools/browser/expect";
import { enforceSafetyConfirmation } from "../tools/browser/safety";

function makeObservation(partial: Partial<BicObservation>): BicObservation {
  return {
    schemaVersion: "0.1",
    observationId: partial.observationId ?? "obs_001",
    createdAt: partial.createdAt ?? "2026-02-14T00:00:00.000Z",
    page: {
      domain: partial.page?.domain ?? "example.com",
      url: partial.page?.url ?? "https://example.com/checkout",
      finalUrl: partial.page?.finalUrl ?? "https://example.com/checkout",
      lang: partial.page?.lang ?? "en",
      title: partial.page?.title ?? "Checkout",
      primaryHeading: partial.page?.primaryHeading ?? "Checkout",
      routeKey: partial.page?.routeKey,
      loadState: partial.page?.loadState ?? "interactive",
      blockingOverlay: partial.page?.blockingOverlay ?? { present: false },
      blockers: partial.page?.blockers ?? [],
      banners: partial.page?.banners ?? [],
      modals: partial.page?.modals ?? [],
      frames: partial.page?.frames ?? [{ frameId: "main" }],
    },
    nextCursor: partial.nextCursor,
    hasMore: partial.hasMore ?? false,
    affordances: partial.affordances ?? [],
    forms: partial.forms ?? [],
  };
}

describe("browser act shaping contract (TASK-05)", () => {
  test("TC-01: expect.urlContains mismatch -> matched=false with diagnostic reason", () => {
    const obs = makeObservation({
      page: { domain: "example.com", url: "https://example.com/login", finalUrl: "https://example.com/login" },
    });

    const verification = evaluateExpectations({
      observation: obs,
      expect: { urlContains: "checkout" },
    });

    expect(verification.matched).toBe(false);
    expect(verification.reason).toContain("urlContains");
    expect(verification.observedDelta).toMatchObject({
      url: "https://example.com/login",
    });
  });

  test("TC-02: expect.modalOpened / modalClosed checks", () => {
    const noModal = makeObservation({ page: { modals: [] } });
    const withModal = makeObservation({ page: { modals: [{ title: "Confirm" }] } });

    const modalOpenedOnNoModal = evaluateExpectations({
      observation: noModal,
      expect: { modalOpened: true },
    });
    expect(modalOpenedOnNoModal.matched).toBe(false);

    const modalClosedOnNoModal = evaluateExpectations({
      observation: noModal,
      expect: { modalClosed: true },
    });
    expect(modalClosedOnNoModal.matched).toBe(true);

    const modalOpenedOnWithModal = evaluateExpectations({
      observation: withModal,
      expect: { modalOpened: true },
    });
    expect(modalOpenedOnWithModal.matched).toBe(true);

    const modalClosedOnWithModal = evaluateExpectations({
      observation: withModal,
      expect: { modalClosed: true },
    });
    expect(modalClosedOnWithModal.matched).toBe(false);
  });

  test("TC-03: danger action without confirm -> SAFETY_CONFIRMATION_REQUIRED + required confirmationText", () => {
    const gated = enforceSafetyConfirmation({
      risk: "danger",
      confirm: undefined,
      confirmationText: undefined,
      requiredConfirmationText: "CONFIRM delete 'Payment method' on example.com",
    });

    expect(gated.ok).toBe(false);
    if (gated.ok) {
      return;
    }

    expect(gated.error.code).toBe("SAFETY_CONFIRMATION_REQUIRED");
    expect(gated.error.details?.requiredConfirmationText).toBe(
      "CONFIRM delete 'Payment method' on example.com"
    );
  });
});

