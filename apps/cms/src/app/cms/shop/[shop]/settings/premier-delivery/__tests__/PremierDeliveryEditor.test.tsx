import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import PremierDeliveryEditor from "../PremierDeliveryEditor";

expect.extend(toHaveNoViolations);

const updatePremierDelivery = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updatePremierDelivery: (...args: any[]) => updatePremierDelivery(...args),
}));
jest.mock(
  "@/components/atoms",
  () => ({
    Toast: ({ open, message, className, role = "status", onClose }: any) =>
      open ? (
        <div role={role} className={className}>
          <span>{message}</span>
          {onClose ? (
            <button type="button" onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>
      ) : null,
    Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  }),
  { virtual: true },
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: ({ id, name, "aria-label": ariaLabel, ...props }: any) => (
      <input id={id} aria-label={ariaLabel} name={name} {...props} />
    ),
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  { virtual: true },
);

describe("PremierDeliveryEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits sanitized form data and displays validation errors", async () => {
    updatePremierDelivery.mockResolvedValue({
      errors: { regions: ["Too few regions"] },
    });

    const { container } = render(
      <PremierDeliveryEditor
        shop="lux"
        initial={{
          regions: ["NY"],
          windows: ["8-10"],
          carriers: ["Sky"],
          serviceLabel: "Rush",
          surcharge: 12,
        }}
      />,
    );

    const serviceLabelInput = screen.getByLabelText(/service label/i);
    await userEvent.clear(serviceLabelInput);
    await userEvent.type(serviceLabelInput, " Premier Delivery ");

    const surchargeInput = screen.getByLabelText(/surcharge/i);
    await userEvent.clear(surchargeInput);
    await userEvent.type(surchargeInput, "5");

    const regionInput = screen.getAllByRole("textbox", { name: /regions/i })[0];
    await userEvent.clear(regionInput);
    await userEvent.type(regionInput, "Paris");

    const windowInput = screen.getAllByRole("textbox", { name: /windows/i })[0];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "10-12");

    const carrierInputs = screen.getAllByRole("textbox", { name: /carriers/i });
    await userEvent.clear(carrierInputs[0]);
    await userEvent.type(carrierInputs[0], "Acme Express");
    await userEvent.click(screen.getByRole("button", { name: /add carrier/i }));

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updatePremierDelivery).toHaveBeenCalledTimes(1);
    const fd = updatePremierDelivery.mock.calls[0][1] as FormData;
    expect(fd.getAll("regions")).toEqual(["Paris"]);
    expect(fd.getAll("windows")).toEqual(["10-12"]);
    expect(fd.getAll("carriers")).toEqual(["Acme Express"]);
    expect(fd.get("serviceLabel")).toEqual("Premier Delivery");
    expect(fd.get("surcharge")).toEqual("5");

    expect(await screen.findByText("Too few regions")).toBeInTheDocument();
    expect(screen.getByText("Too few regions")).toHaveAttribute(
      "data-token",
      "--color-danger",
    );

    expect(
      await screen.findByText(/unable to update premier delivery settings\./i),
    ).toBeInTheDocument();

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

    const regionsField = screen.getByText("Regions").closest("div");
    const windowsField = screen.getByText(/One-hour windows/i).closest("div");
    if (!regionsField || !windowsField) {
      throw new Error("Expected collection fields to render");
    }
    const getRegionInputs = () => within(regionsField).getAllByRole("textbox");
    const getWindowInputs = () => within(windowsField).getAllByRole("textbox");

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    await waitFor(() => {
      expect(getRegionInputs()).toHaveLength(2);
    });

    let regionInputs = getRegionInputs();
    await userEvent.type(regionInputs[1], "Berlin");

    const firstRegionRow = regionInputs[0].closest("div");
    if (!firstRegionRow) {
      throw new Error("Expected a region input row container");
    }
    await userEvent.click(
      within(firstRegionRow).getByRole("button", { name: /remove/i }),
    );
    await waitFor(() => {
      expect(getRegionInputs()).toHaveLength(1);
    });

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText("Invalid window")).toBeInTheDocument();
    expect(
      await screen.findByText(/unable to update premier delivery settings\./i),
    ).toBeInTheDocument();

    const windowInputs = getWindowInputs();
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], "11-12");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid window")).not.toBeInTheDocument();
    });

    expect(
      await screen.findByText(/premier delivery settings saved\./i),
    ).toBeInTheDocument();
  });
});
