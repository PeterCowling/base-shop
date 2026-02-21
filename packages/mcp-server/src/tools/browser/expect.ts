import type { BicObservation } from "./bic.js";

export type BrowserExpectations = {
  urlContains?: string;
  titleContains?: string;
  headingContains?: string;
  modalOpened?: boolean;
  modalClosed?: boolean;
  modalTitleContains?: string;
  bannerContains?: string;
};

export type BrowserVerificationResult = {
  matched: boolean;
  reason: string;
  observedDelta: Readonly<Record<string, unknown>>;
};

function normalizeText(input: string | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

export function evaluateExpectations(input: {
  observation: BicObservation;
  expect?: BrowserExpectations;
}): BrowserVerificationResult {
  const expect = input.expect;
  if (!expect || Object.keys(expect).length === 0) {
    return {
      matched: true,
      reason: "No expectations provided.",
      observedDelta: {},
    };
  }

  const url = input.observation.page.finalUrl || input.observation.page.url;
  const title = input.observation.page.title ?? "";
  const heading = input.observation.page.primaryHeading ?? "";
  const modals = input.observation.page.modals ?? [];
  const banners = input.observation.page.banners ?? [];

  if (typeof expect.urlContains === "string" && expect.urlContains.trim()) {
    if (!url.includes(expect.urlContains)) {
      return {
        matched: false,
        reason: `Expectation failed: urlContains="${expect.urlContains}"`,
        observedDelta: { url },
      };
    }
  }

  if (typeof expect.titleContains === "string" && expect.titleContains.trim()) {
    if (!normalizeText(title).includes(normalizeText(expect.titleContains))) {
      return {
        matched: false,
        reason: `Expectation failed: titleContains="${expect.titleContains}"`,
        observedDelta: { title },
      };
    }
  }

  if (typeof expect.headingContains === "string" && expect.headingContains.trim()) {
    if (!normalizeText(heading).includes(normalizeText(expect.headingContains))) {
      return {
        matched: false,
        reason: `Expectation failed: headingContains="${expect.headingContains}"`,
        observedDelta: { heading },
      };
    }
  }

  const expectsModalOpened = expect.modalOpened === true;
  const expectsModalClosed = expect.modalClosed === true;
  if (expectsModalOpened && expectsModalClosed) {
    return {
      matched: false,
      reason: "Expectation invalid: both modalOpened and modalClosed were set to true.",
      observedDelta: { modalCount: modals.length },
    };
  }

  if (expectsModalOpened && modals.length === 0) {
    return {
      matched: false,
      reason: "Expectation failed: modalOpened=true",
      observedDelta: { modalCount: 0 },
    };
  }

  if (expectsModalClosed && modals.length > 0) {
    return {
      matched: false,
      reason: "Expectation failed: modalClosed=true",
      observedDelta: { modalCount: modals.length },
    };
  }

  if (typeof expect.modalTitleContains === "string" && expect.modalTitleContains.trim()) {
    const needle = normalizeText(expect.modalTitleContains);
    const anyMatch = modals.some((modal) => normalizeText(modal.title).includes(needle));
    if (!anyMatch) {
      return {
        matched: false,
        reason: `Expectation failed: modalTitleContains="${expect.modalTitleContains}"`,
        observedDelta: { modalTitles: modals.map((m) => m.title ?? "") },
      };
    }
  }

  if (typeof expect.bannerContains === "string" && expect.bannerContains.trim()) {
    const needle = normalizeText(expect.bannerContains);
    const anyMatch = banners.some((b) => normalizeText(b.text).includes(needle));
    if (!anyMatch) {
      return {
        matched: false,
        reason: `Expectation failed: bannerContains="${expect.bannerContains}"`,
        observedDelta: { banners: banners.map((b) => b.text) },
      };
    }
  }

  return {
    matched: true,
    reason: "All expectations matched.",
    observedDelta: {},
  };
}

