// src/test/context/modal-single-host.test.tsx
/* -------------------------------------------------------------------------- */
/*  TASK-05: Single modal host invariant — TC-02 + TC-04                      */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";

import React from "react";
import { act, render } from "@testing-library/react";

// Use relative imports to bypass moduleNameMapper CMS stub
import { ModalProvider } from "../../context/modal/provider";

// Use relative path to bypass moduleNameMapper CMS stub (same issue as TASK-04)
jest.mock("../../utils/prefetchInteractive", () => ({
  prefetchInteractiveBundlesNow: () => Promise.resolve(),
}));

jest.mock("../../context/modal/global-modals", () => ({
  GlobalModals: () => null,
}));

describe("TASK-05: Single modal host invariant", () => {
  // TC-02: a single ModalProvider does NOT produce any invariant error
  it("TC-02: single ModalProvider mounts without invariant error", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      render(
        <ModalProvider>
          <div data-testid="child" />
        </ModalProvider>,
      );
    });

    const invariantCalls = consoleSpy.mock.calls.filter((args) =>
      typeof args[0] === "string" && args[0].includes("[ModalProvider] Invariant"),
    );
    expect(invariantCalls).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  // TC-04: invariant fires when a second ModalProvider is nested inside the first
  it("TC-04: nested ModalProvider logs invariant error", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      render(
        <ModalProvider>
          <ModalProvider>
            <div />
          </ModalProvider>
        </ModalProvider>,
      );
    });

    const invariantCalls = consoleSpy.mock.calls.filter((args) =>
      typeof args[0] === "string" && args[0].includes("[ModalProvider] Invariant"),
    );
    expect(invariantCalls.length).toBeGreaterThanOrEqual(1);
    expect(invariantCalls[0]?.[0]).toMatch(/nested ModalProvider/);

    consoleSpy.mockRestore();
  });
});
