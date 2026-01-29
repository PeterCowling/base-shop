/**
 * CaptureFAB Component Tests
 * BOS-UX-14
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CaptureFAB } from "./CaptureFAB";

describe("CaptureFAB", () => {
  it("renders floating action button", () => {
    render(<CaptureFAB />);

    const button = screen.getByRole("button", { name: /capture idea/i });
    expect(button).toBeInTheDocument();
  });

  it("opens modal when clicked", async () => {
    const user = userEvent.setup();
    render(<CaptureFAB />);

    const button = screen.getByRole("button", { name: /capture idea/i });
    await user.click(button);

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/quick capture/i)).toBeInTheDocument();
  });

  it("closes modal when onClose is called", async () => {
    const user = userEvent.setup();
    render(<CaptureFAB />);

    // Open modal
    const button = screen.getByRole("button", { name: /capture idea/i });
    await user.click(button);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole("button", { name: /close modal/i });
    await user.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has fixed positioning", () => {
    render(<CaptureFAB />);

    const button = screen.getByRole("button", { name: /capture idea/i });

    // Check for Tailwind's fixed class
    expect(button.className).toContain("fixed");
  });

  it("displays plus icon", () => {
    render(<CaptureFAB />);

    const button = screen.getByRole("button", { name: /capture idea/i });
    const svg = button.querySelector("svg");

    expect(svg).toBeInTheDocument();
  });

  it("hides on desktop viewports", () => {
    // Mock window.matchMedia to simulate desktop
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false, // Desktop viewport
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<CaptureFAB />);

    const button = screen.getByRole("button", { name: /capture idea/i });
    // Should have display: none or hidden class on desktop
    const styles = window.getComputedStyle(button);

    // Will check for md:hidden class in implementation
    expect(button.className).toContain("md:hidden");
  });
});
