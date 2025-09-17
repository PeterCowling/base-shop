import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import PremierDeliveryEditor from "../PremierDeliveryEditor";
import {
  __getUseSettingsSaveFormToastLog,
  __resetUseSettingsSaveFormMock,
} from "../../hooks/useSettingsSaveForm";

jest.mock("../../hooks/useSettingsSaveForm");

expect.extend(toHaveNoViolations);

const updatePremierDelivery = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updatePremierDelivery: (...args: any[]) => updatePremierDelivery(...args),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    __esModule: true,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: ({ name, "aria-label": ariaLabel, ...props }: any) => (
      <input aria-label={ariaLabel ?? name} name={name} {...props} />
    ),
  }),
  { virtual: true },
);
jest.mock("@/components/atoms", () => ({
  __esModule: true,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Toast: ({ open, message, className, ...props }: any) =>
    open ? (
      <div role="status" className={className} {...props}>
        {message}
      </div>
    ) : null,
}));

describe("PremierDeliveryEditor", () => {
  beforeEach(() => {
    __resetUseSettingsSaveFormMock();
    jest.clearAllMocks();
  });

  it("submits regions and windows and displays validation errors", async () => {
    updatePremierDelivery.mockResolvedValue({
      errors: { regions: ["Too few regions"] },
    });

    const { container } = render(
      <PremierDeliveryEditor
        shop="lux"
        initial={{ regions: ["NY"], windows: ["8-10"] }}
      />,
    );

    const regionInput = screen.getAllByRole("textbox", { name: /regions/i })[0];
    await userEvent.clear(regionInput);
    await userEvent.type(regionInput, "Paris");
    await userEvent.click(screen.getByRole("button", { name: /add region/i }));

    const windowInput = screen.getAllByRole("textbox", { name: /windows/i })[0];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "10-12");
    await userEvent.click(screen.getByRole("button", { name: /add window/i }));

    const carrierInput = screen.getAllByRole("textbox", { name: /carriers/i })[0];
    await userEvent.clear(carrierInput);
    await userEvent.type(carrierInput, "DHL Express");

    const serviceLabelInput = screen.getByLabelText(/service label/i);
    await userEvent.clear(serviceLabelInput);
    await userEvent.type(serviceLabelInput, " Premier Delivery ");

    const surchargeInput = screen.getByLabelText(/surcharge/i);
    await userEvent.clear(surchargeInput);
    await userEvent.type(surchargeInput, " 9.50 ");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updatePremierDelivery).toHaveBeenCalledTimes(1);
    const fd = updatePremierDelivery.mock.calls[0][1] as FormData;
    expect(fd.getAll("regions")).toEqual(["Paris"]);
    expect(fd.getAll("windows")).toEqual(["10-12"]);
    expect(fd.getAll("carriers")).toEqual(["DHL Express"]);
    expect(fd.get("serviceLabel")).toBe("Premier Delivery");
    expect(fd.get("surcharge")).toBe("9.5");

    const regionError = await screen.findByText("Too few regions");
    expect(regionError).toHaveAttribute("data-token", "--color-danger");

    const toastLog = __getUseSettingsSaveFormToastLog();
    expect(toastLog.at(-1)).toEqual({
      status: "error",
      message: "Unable to update premier delivery settings.",
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("supports adding/removing entries and clears errors after success", async () => {
    updatePremierDelivery
      .mockResolvedValueOnce({ errors: { windows: ["Invalid window"] } })
      .mockResolvedValueOnce({ settings: {} });

    render(
      <PremierDeliveryEditor
        shop="lux"
        initial={{ regions: ["Rome"], windows: ["9-11"] }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    expect(screen.getAllByRole("textbox", { name: /regions/i })).toHaveLength(2);

    const regionInputs = screen.getAllByRole("textbox", { name: /regions/i });
    await userEvent.type(regionInputs[1], "Berlin");
    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(screen.getAllByRole("textbox", { name: /regions/i })).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    const toastLog = __getUseSettingsSaveFormToastLog();
    expect(await screen.findByText("Invalid window")).toHaveAttribute(
      "data-token",
      "--color-danger",
    );
    expect(toastLog.at(-1)).toEqual({
      status: "error",
      message: "Unable to update premier delivery settings.",
    });

    const windowInputs = screen.getAllByRole("textbox", { name: /windows/i });
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], "11-12");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid window")).not.toBeInTheDocument();
    });

    expect(toastLog.at(-1)).toEqual({
      status: "success",
      message: "Premier delivery settings saved.",
    });
  });
});
