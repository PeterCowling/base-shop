import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hoc/withModalBackground", () => ({
  withModalBackground: (Comp: React.ComponentType) => Comp,
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: () => void;
    submitLabel?: string;
  }) => (
    <button data-cy="password-reauth" onClick={onSubmit}>
      {submitLabel ?? "Confirm"}
    </button>
  ),
}));

const toastMock = jest.fn();
jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

async function loadFloat() {
  const mod = await import("../FloatEntryModal");
  return { Comp: mod.default };
}

async function loadRemoval() {
  const mod = await import("../TenderRemovalModal");
  return { Comp: mod.default };
}

describe("FloatEntryModal", () => {
  it("confirms amount without approvals", async () => {
    const { Comp } = await loadFloat();
    const onConfirm = jest.fn();
    render(
      <Comp onConfirm={onConfirm} onClose={jest.fn()} />
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "60");
    await userEvent.click(screen.getByRole("button", { name: /confirm change/i }));

    expect(onConfirm).toHaveBeenCalledWith(60);
  });

  it("ignores zero and non-numeric amounts", async () => {
    const { Comp } = await loadFloat();
    const onConfirm = jest.fn();
    render(
      <Comp onConfirm={onConfirm} onClose={jest.fn()} />
    );

    const input = screen.getByPlaceholderText("Amount");

    await userEvent.type(input, "0");
    await userEvent.click(screen.getByRole("button", { name: /confirm change/i }));
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, "bad");
    await userEvent.click(screen.getByRole("button", { name: /confirm change/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not include a comment input", async () => {
    const { Comp } = await loadFloat();
    render(
      <Comp onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    expect(screen.queryByPlaceholderText("Comment (optional)")).not.toBeInTheDocument();
  });

  it("applies dark mode styles", async () => {
    const { Comp } = await loadFloat();
    document.documentElement.classList.add("dark");
    render(
      <Comp onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    const heading = screen.getByRole("heading", { name: /add change/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("invokes onClose when close button clicked", async () => {
    const { Comp } = await loadFloat();
    const onClose = jest.fn();
    render(
      <Comp onConfirm={jest.fn()} onClose={onClose} />
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("TenderRemovalModal", () => {
  it("auto adjusts destination", async () => {
    const { Comp } = await loadRemoval();
    const onConfirm = jest.fn();
    render(
      <Comp onConfirm={onConfirm} onClose={jest.fn()} />
    );

    const typeSel = screen.getByDisplayValue("Safe Drop");
    await userEvent.selectOptions(typeSel, "BANK_DROP");
    const destSel = screen.getByDisplayValue("Bank");
    expect(destSel).toBeInTheDocument();

    await userEvent.selectOptions(typeSel, "LIFT");
    expect(screen.getByDisplayValue("Safe")).toBeInTheDocument();
  });

  it("confirms removal without approvals", async () => {
    const { Comp } = await loadRemoval();
    const onConfirm = jest.fn();
    render(
      <Comp onConfirm={onConfirm} onClose={jest.fn()} />
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "100");
    await userEvent.click(screen.getByRole("button", { name: /confirm removal/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      amount: 100,
      removalType: "SAFE_DROP",
      destination: "SAFE",
    });
  });

  it("renders password reauth when pin required", async () => {
    const { Comp } = await loadRemoval();
    render(
      <Comp
        onConfirm={jest.fn()}
        onClose={jest.fn()}
        pinRequiredForTenderRemoval
      />
    );
    expect(screen.getByTestId("password-reauth")).toBeInTheDocument();
  });

  it("blocks confirmation when removal data invalid", async () => {
    const { Comp } = await loadRemoval();
    const onConfirm = jest.fn();
    toastMock.mockReset();
    render(
      <Comp onConfirm={onConfirm} onClose={jest.fn()} />
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "0");
    await userEvent.click(screen.getByRole("button", { name: /confirm removal/i }));

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled();
    });
    expect(toastMock).toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    const { Comp } = await loadRemoval();
    document.documentElement.classList.add("dark");
    render(
      <Comp onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    const heading = screen.getByRole("heading", { name: /remove cash/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });
});
