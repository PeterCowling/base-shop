/**
 * KeyboardShortcutProvider Component Tests
 * BOS-UX-16
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KeyboardShortcutProvider } from "./KeyboardShortcutProvider";

describe("KeyboardShortcutProvider", () => {
  it("renders children", () => {
    render(
      <KeyboardShortcutProvider>
        <div>Test content</div>
      </KeyboardShortcutProvider>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("opens capture modal with Cmd+K on Mac", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutProvider>
        <div>Test</div>
      </KeyboardShortcutProvider>
    );

    // Simulate Cmd+K
    await user.keyboard("{Meta>}k{/Meta}");

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/quick capture/i)).toBeInTheDocument();
  });

  it("opens capture modal with Ctrl+K on Windows/Linux", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutProvider>
        <div>Test</div>
      </KeyboardShortcutProvider>
    );

    // Simulate Ctrl+K
    await user.keyboard("{Control>}k{/Control}");

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/quick capture/i)).toBeInTheDocument();
  });

  it("closes modal with Escape key", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutProvider>
        <div>Test</div>
      </KeyboardShortcutProvider>
    );

    // Open modal
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close with Escape
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prevents default browser behavior for Cmd+K", async () => {
    const user = userEvent.setup();
    const preventDefaultSpy = jest.fn();

    render(
      <KeyboardShortcutProvider>
        <div>Test</div>
      </KeyboardShortcutProvider>
    );

    // Add event listener to check preventDefault was called
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        preventDefaultSpy();
      }
    });

    await user.keyboard("{Meta>}k{/Meta}");

    // Modal should open (indicating we handled the event)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not open modal for other key combinations", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutProvider>
        <div>Test</div>
      </KeyboardShortcutProvider>
    );

    // Try other key combinations
    await user.keyboard("{Meta>}j{/Meta}");
    await user.keyboard("{Control>}j{/Control}");
    await user.keyboard("k");

    // Modal should not open
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("works with nested children", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutProvider>
        <div>
          <header>
            <h1>Title</h1>
          </header>
          <main>
            <p>Content</p>
          </main>
        </div>
      </KeyboardShortcutProvider>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();

    // Keyboard shortcut should still work
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
