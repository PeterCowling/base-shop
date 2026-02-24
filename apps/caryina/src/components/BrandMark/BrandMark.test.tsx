import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BrandMark } from "./BrandMark";

function mockMatchMedia(matchesByQuery: Record<string, boolean>) {
  const factory = (query: string) => ({
    matches: Boolean(matchesByQuery[query]),
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn(factory),
  });
}

describe("BrandMark", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the final static state when animation is disabled", () => {
    render(<BrandMark animate={false} />);

    const root = screen.getByRole("img", { name: "Carina" });
    expect(root).toHaveAttribute("data-state", "to");
    expect(
      screen.getByText("Un solo dettaglio. Quello carino.")
    ).toBeInTheDocument();
  });

  it("does not render the particle canvas when reduced motion is preferred", async () => {
    mockMatchMedia({
      "(prefers-reduced-motion: reduce)": true,
      "(hover: hover) and (pointer: fine)": false,
    });

    render(<BrandMark trigger="mount" animate />);

    const root = screen.getByRole("img", { name: "Carina" });
    await waitFor(() => {
      expect(root).toHaveAttribute("data-state", "to");
    });

    expect(root.querySelector("canvas")).toBeNull();
    expect(root).toHaveAttribute("data-particle-state", "done");
  });

  it("ignores hover replay on coarse pointer devices", async () => {
    mockMatchMedia({
      "(prefers-reduced-motion: reduce)": false,
      "(hover: hover) and (pointer: fine)": false,
    });

    render(<BrandMark trigger="hover" animate />);

    const root = screen.getByRole("img", { name: "Carina" });
    await waitFor(() => {
      expect(root).toHaveAttribute("data-state", "to");
    });

    const particleStateBeforeHover = root.getAttribute("data-particle-state");
    fireEvent.pointerEnter(root);
    expect(root).toHaveAttribute("data-state", "to");
    expect(root.getAttribute("data-particle-state")).toBe(
      particleStateBeforeHover
    );
  });
});
