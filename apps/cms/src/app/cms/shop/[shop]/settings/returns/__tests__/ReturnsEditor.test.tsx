import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import ReturnsEditor from "../ReturnsEditor";

expect.extend(toHaveNoViolations as any);

const updateUpsReturns = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateUpsReturns: (...args: any[]) => updateUpsReturns(...args),
}));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, role = "status", onClose, className }: any) => {
    if (!open) return null;
    return (
      <div role={role} className={className}>
        <span>{message}</span>
        {onClose ? (
          <button type="button" onClick={onClose}>
            ×
          </button>
        ) : null}
      </div>
    );
  },
  Switch: ({ onChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(event) => onChange?.(event)}
      {...props}
    />
  ),
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  { virtual: true },
);

describe("ReturnsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits toggles, surfaces validation errors, and announces failure", async () => {
    updateUpsReturns.mockResolvedValue({ errors: { enabled: ["Required"] } });

    const { container } = render(
      <ReturnsEditor
        shop="lux"
        initial={{ upsEnabled: false, bagEnabled: false, homePickupEnabled: false }}
      />,
    );

    const [enable, bag, pickup] = screen.getAllByRole("checkbox");
    await userEvent.click(enable);
    await userEvent.click(bag);
    await userEvent.click(pickup);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateUpsReturns).toHaveBeenCalledTimes(1);
    const fd = updateUpsReturns.mock.calls[0][1] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("bagEnabled")).toBe("on");
    expect(fd.get("homePickupEnabled")).toBe("on");

    expect(await screen.findByText("Required")).toBeInTheDocument();
    const errorToast = await screen.findByRole("status");
    expect(errorToast).toHaveTextContent("Unable to update return options.");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("requires enabling at least one return option before submitting", async () => {
    const { container } = render(
      <ReturnsEditor
        shop="lux"
        initial={{ upsEnabled: false, bagEnabled: false, homePickupEnabled: false }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateUpsReturns).not.toHaveBeenCalled();

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(
      "Select at least one return option before saving.",
    );

    const inlineErrors = screen
      .getAllByText("Select at least one return option before saving.")
      .filter((element) => !toast.contains(element));
    expect(inlineErrors.length).toBeGreaterThanOrEqual(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies server state on success and announces completion", async () => {
    updateUpsReturns.mockResolvedValue({
      settings: {
        returnService: {
          upsEnabled: false,
          bagEnabled: true,
          homePickupEnabled: false,
        },
      },
    });

    render(
      <ReturnsEditor
        shop="lux"
        initial={{ upsEnabled: true, bagEnabled: false, homePickupEnabled: true }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const [enable, bag, pickup] = screen.getAllByRole("checkbox");
      expect(enable).not.toBeChecked();
      expect(bag).toBeChecked();
      expect(pickup).not.toBeChecked();
    });

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Return options updated.");
  });
});
