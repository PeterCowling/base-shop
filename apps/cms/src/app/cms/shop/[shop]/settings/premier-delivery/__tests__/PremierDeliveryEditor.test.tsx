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
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, className, ...props }: any) =>
    open ? (
      <div role="status" className={className} {...props}>
        {message}
      </div>
    ) : null,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: ({ name, id, "aria-label": ariaLabel, ...props }: any) => {
      const inputProps: Record<string, unknown> = { id, name, ...props };
      if (ariaLabel) {
        inputProps["aria-label"] = ariaLabel;
      }
      return <input {...inputProps} />;
    },
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
        initial={{ regions: ["NY"], windows: ["8-10"] }}
      />,
    );

    const serviceLabelInput = screen.getByLabelText(/service label/i);
    await userEvent.clear(serviceLabelInput);
    await userEvent.type(serviceLabelInput, " Premier Delivery Plus ");

    const surchargeInput = screen.getByLabelText(/surcharge/i);
    await userEvent.clear(surchargeInput);
    await userEvent.type(surchargeInput, "12");

    const primaryRegionInput = screen.getAllByRole("textbox", { name: /regions/i })[0];
    await userEvent.clear(primaryRegionInput);
    await userEvent.type(primaryRegionInput, " Paris ");

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    const regionsContainer = screen
      .getByText("Regions")
      .closest("div") as HTMLElement;
    const extraRegionInput = within(regionsContainer).getAllByRole("textbox")[1];
    await userEvent.type(extraRegionInput, "   ");

    const windowInput = screen.getAllByRole("textbox", { name: /one-hour windows/i })[0];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "10-12");

    const carrierInput = screen.getAllByRole("textbox", { name: /carriers/i })[0];
    await userEvent.clear(carrierInput);
    await userEvent.type(carrierInput, " Rapid Logistics  ");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(updatePremierDelivery).toHaveBeenCalledTimes(1);
    });

    const fd = updatePremierDelivery.mock.calls[0][1] as FormData;
    expect(fd.get("serviceLabel")).toBe("Premier Delivery Plus");
    expect(fd.get("surcharge")).toBe("12");
    expect(fd.getAll("regions")).toEqual(["Paris"]);
    expect(fd.getAll("windows")).toEqual(["10-12"]);
    expect(fd.getAll("carriers")).toEqual(["Rapid Logistics"]);

    const errorToast = await screen.findByRole("status");
    expect(errorToast).toHaveTextContent(
      /Unable to update premier delivery settings\./,
    );

    const regionError = await screen.findByText("Too few regions");
    expect(regionError).toHaveAttribute("data-token", "--color-danger");

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

    const regionsContainer = screen
      .getByText("Regions")
      .closest("div") as HTMLElement;
    const windowsContainer = screen
      .getByText(/One-hour windows/i)
      .closest("div") as HTMLElement;

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    expect(within(regionsContainer).getAllByRole("textbox")).toHaveLength(2);

    const regionInputs = within(regionsContainer).getAllByRole("textbox");
    await userEvent.type(regionInputs[1], "Berlin");
    await userEvent.click(
      within(regionsContainer).getAllByRole("button", { name: /remove/i })[0],
    );
    expect(within(regionsContainer).getAllByRole("textbox")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    const validationToast = await screen.findByRole("status");
    expect(validationToast).toHaveTextContent(
      /Unable to update premier delivery settings\./,
    );

    expect(await screen.findByText("Invalid window")).toBeInTheDocument();

    const windowInputs = within(windowsContainer).getAllByRole("textbox");
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], "11-12");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid window")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /Premier delivery settings saved\./,
      );
    });
  });
});
