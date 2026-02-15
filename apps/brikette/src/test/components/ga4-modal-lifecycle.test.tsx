import "@testing-library/jest-dom";

import React, { useContext } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { fireModalOpen } from "@/utils/ga4-events";

// IMPORTANT: use relative imports to bypass Brikette's Jest moduleNameMapper stubs for @/context/modal/*.
import { ModalContext } from "../../context/modal/context";
import { ModalProvider } from "../../context/modal/provider";

jest.mock("@/utils/prefetchInteractive", () => ({
  prefetchInteractiveBundlesNow: () => Promise.resolve(),
}));

jest.mock("../../context/modal/global-modals", () => ({
  GlobalModals: () => null,
}));

function Probe(): JSX.Element {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("Missing ModalProvider");
  }

  return (
    <>
      <div data-cy="active-modal">{ctx.activeModal ?? "none"}</div>
      <button type="button" onClick={() => ctx.openModal("booking", { source: "hero" })}>
        open
      </button>
      <button type="button" onClick={() => ctx.closeModal()}>
        close
      </button>
    </>
  );
}

describe("GA4 modal_open/modal_close (GA4-modal-lifecycle)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("emits modal_open and modal_close with modal_type + source", () => {
    // Sanity check: GA4 helper is wired to gtag in this environment.
    fireModalOpen({ modalType: "booking", source: "hero" });
    const gtag = window.gtag as unknown as jest.Mock;
    expect(gtag.mock.calls.length).toBeGreaterThan(0);
    gtag.mockClear();

    render(
      <ModalProvider>
        <Probe />
      </ModalProvider>,
    );

    expect(screen.getByTestId("active-modal")).toHaveTextContent("none");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open" }));
    });

    expect(screen.getByTestId("active-modal")).toHaveTextContent("booking");
    expect(
      gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "modal_open")?.[2],
    ).toEqual(
      expect.objectContaining({
        modal_type: "booking",
        source: "hero",
      }),
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });

    expect(screen.getByTestId("active-modal")).toHaveTextContent("none");
    expect(
      gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "modal_close")?.[2],
    ).toEqual(
      expect.objectContaining({
        modal_type: "booking",
        source: "hero",
      }),
    );
  });
});
