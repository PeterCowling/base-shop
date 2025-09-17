import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import ReturnsEditor from "../ReturnsEditor";

expect.extend(toHaveNoViolations);

const updateUpsReturns = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateUpsReturns: (...args: any[]) => updateUpsReturns(...args),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Checkbox: ({ onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
  }),
  { virtual: true },
);

describe("ReturnsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits toggles and surfaces validation errors", async () => {
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

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies server state on success", async () => {
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
  });
});
