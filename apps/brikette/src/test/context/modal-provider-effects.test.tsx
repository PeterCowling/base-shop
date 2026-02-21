// src/test/context/modal-provider-effects.test.tsx
/* -------------------------------------------------------------------------- */
/*  TASK-06: Provider effect decomposition — TC-02, TC-03, TC-04              */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";

import React, { useContext } from "react";
import { act, fireEvent, render } from "@testing-library/react";

// Use relative imports to bypass moduleNameMapper CMS stub
import { ModalContext } from "../../context/modal/context";
import { ModalProvider } from "../../context/modal/provider";

// ---------------------------------------------------------------------------
// Mock i18n — jest.fn() in factory; __esModule:true for default-import interop.
// Note: jest.mock is hoisted before variable declarations, so the factory
// cannot reference module-scope variables. Use jest.requireMock in tests.
// ---------------------------------------------------------------------------
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { loadNamespaces: jest.fn().mockResolvedValue(undefined) },
}));

// ---------------------------------------------------------------------------
// Standard provider mocks
// ---------------------------------------------------------------------------
jest.mock("../../utils/prefetchInteractive", () => ({
  prefetchInteractiveBundlesNow: () => Promise.resolve(),
}));

jest.mock("../../context/modal/global-modals", () => ({
  GlobalModals: () => null,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function ModalProbe(): JSX.Element {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("Missing ModalProvider");
  return (
    <>
      {/* Project uses data-cy as testIdAttribute in RTL config */}
      <span data-cy="active">{ctx.activeModal ?? "none"}</span>
      <button type="button" onClick={() => ctx.openModal("booking", { source: "test" })}>open</button>
      <button type="button" onClick={() => ctx.closeModal()}>close</button>
    </>
  );
}

function getMockLoadNamespaces(): jest.Mock {
  const mod = jest.requireMock("@/i18n") as { default: { loadNamespaces: jest.Mock } };
  return mod.default.loadNamespaces;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TASK-06: provider effect decomposition", () => {
  beforeEach(() => {
    getMockLoadNamespaces().mockClear();
  });

  // TC-02: i18n preload — bookPage namespace loaded on provider mount
  it("TC-02: loads MODAL_I18N_PRELOAD_NAMESPACES on mount", () => {
    act(() => {
      render(
        <ModalProvider>
          <div />
        </ModalProvider>,
      );
    });

    const mockFn = getMockLoadNamespaces();
    expect(mockFn).toHaveBeenCalledTimes(1);
    const args = mockFn.mock.calls[0]?.[0] as string[];
    expect(Array.isArray(args)).toBe(true);
    expect(args).toContain("bookPage");
  });

  // TC-03a: Escape key closes the active modal
  it("TC-03a: Escape key closes active modal", () => {
    const { getByText, getByTestId } = render(
      <ModalProvider>
        <ModalProbe />
      </ModalProvider>,
    );

    act(() => {
      getByText("open").click();
    });
    expect(getByTestId("active").textContent).toBe("booking");

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(getByTestId("active").textContent).toBe("none");
  });

  // TC-03b: Escape key is a no-op when no modal is open
  it("TC-03b: Escape key is no-op when no modal is active", () => {
    const { getByTestId } = render(
      <ModalProvider>
        <ModalProbe />
      </ModalProvider>,
    );

    // Flush initial effects before interacting
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(getByTestId("active").textContent).toBe("none");
  });

  // TC-03c: Focus is restored to the trigger element after close
  it("TC-03c: focus returns to the last focused element on close", () => {
    const { getByText } = render(
      <ModalProvider>
        <ModalProbe />
      </ModalProvider>,
    );

    const openBtn = getByText("open");
    act(() => {
      openBtn.focus();
      openBtn.click();
    });

    act(() => {
      getByText("close").click();
    });

    expect(document.activeElement).toBe(openBtn);
  });

  // TC-04: preload fires on mount, before any openModal call
  it("TC-04: preload fires on mount before first openModal", () => {
    const callOrder: string[] = [];
    const mockFn = getMockLoadNamespaces();
    mockFn.mockImplementation(() => {
      callOrder.push("preload");
      return Promise.resolve();
    });

    const { getByText } = render(
      <ModalProvider>
        <ModalProbe />
      </ModalProvider>,
    );

    // Flush useEffect([]) so preload fires
    act(() => {
      // no-op body — just flush pending effects
    });

    expect(callOrder).toContain("preload");
    expect(callOrder.indexOf("preload")).toBe(0);

    act(() => {
      getByText("open").click();
    });

    // preload was only called once even after open
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
