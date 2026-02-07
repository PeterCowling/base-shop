import "../../../../../../test/resetNextMocks";

import { configure, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";

import { ConfirmDialog } from "../ConfirmDialog";

configure({ testIdAttribute: "data-testid" });

describe("ConfirmDialog", () => {
  // TC-01: Dialog renders when open=true → title and buttons visible
  it("renders dialog when open is true", () => {
    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm Action"
          confirmLabel="Confirm"
          onConfirm={jest.fn()}
        />
      </TranslationsProvider>,
    );

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  // TC-02: Confirm button fires onConfirm and closes → callback called
  it("fires onConfirm when confirm button is clicked", async () => {
    const handleConfirm = jest.fn();
    const handleOpenChange = jest.fn();

    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Confirm Action"
          confirmLabel="Confirm"
          onConfirm={handleConfirm}
        />
      </TranslationsProvider>,
    );

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    await userEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  // TC-03: Cancel button fires onOpenChange(false) → dialog closes
  it("fires onOpenChange with false when cancel button is clicked", async () => {
    const handleOpenChange = jest.fn();

    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Confirm Action"
          confirmLabel="Confirm"
          onConfirm={jest.fn()}
        />
      </TranslationsProvider>,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  // TC-04: Escape key cancels → dialog closes without firing onConfirm
  it("closes dialog on Escape key without firing onConfirm", async () => {
    const handleConfirm = jest.fn();
    const handleOpenChange = jest.fn();

    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Confirm Action"
          confirmLabel="Confirm"
          onConfirm={handleConfirm}
        />
      </TranslationsProvider>,
    );

    await userEvent.keyboard("{Escape}");

    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  // TC-05: Destructive variant applies danger styling → confirm button has danger/destructive class
  it("applies destructive styling when variant is destructive", () => {
    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Delete Item"
          confirmLabel="Delete"
          onConfirm={jest.fn()}
          variant="destructive"
        />
      </TranslationsProvider>,
    );

    const confirmButton = screen.getByRole("button", { name: "Delete" });
    // Button should have danger color classes (bg-danger text-danger-foreground)
    expect(confirmButton.className).toContain("bg-danger");
  });

  it("renders with description when provided", () => {
    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm Action"
          description="Are you sure you want to proceed?"
          confirmLabel="Confirm"
          onConfirm={jest.fn()}
        />
      </TranslationsProvider>,
    );

    expect(screen.getByText("Are you sure you want to proceed?")).toBeInTheDocument();
  });

  it("uses custom cancel label when provided", () => {
    render(
      <TranslationsProvider messages={en}>
        <ConfirmDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm Action"
          confirmLabel="Confirm"
          cancelLabel="Abort"
          onConfirm={jest.fn()}
        />
      </TranslationsProvider>,
    );

    expect(screen.getByRole("button", { name: "Abort" })).toBeInTheDocument();
  });
});
