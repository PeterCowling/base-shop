import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import {
  __getUseSettingsSaveFormToastLog,
  __resetUseSettingsSaveFormMock,
} from "../../hooks/useSettingsSaveForm";
import ReturnsEditor from "../ReturnsEditor";

jest.mock("../../hooks/useSettingsSaveForm");

expect.extend(toHaveNoViolations as any);

const updateUpsReturns = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateUpsReturns: (...args: any[]) => updateUpsReturns(...args),
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
    __resetUseSettingsSaveFormMock();
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
    expect(__getUseSettingsSaveFormToastLog().at(-1)).toEqual({
      status: "error",
      message: "Unable to update return options.",
    });

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

    expect(__getUseSettingsSaveFormToastLog().at(-1)).toEqual({
      status: "error",
      message: "Select at least one return option before saving.",
    });

    const inlineErrors = screen
      .getAllByText("Select at least one return option before saving.")
      .filter((element) => element.tagName !== "BUTTON");
    expect(inlineErrors.length).toBeGreaterThan(0);

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

    expect(__getUseSettingsSaveFormToastLog().at(-1)).toEqual({
      status: "success",
      message: "Return options updated.",
    });
  });
});
