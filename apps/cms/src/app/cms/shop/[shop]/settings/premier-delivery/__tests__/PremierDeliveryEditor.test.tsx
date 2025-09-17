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
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: ({ name, "aria-label": ariaLabel, ...props }: any) => (
      <input aria-label={ariaLabel ?? name} name={name} {...props} />
    ),
  }),
  { virtual: true },
);

describe("PremierDeliveryEditor", () => {
  beforeEach(() => {
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

    const windowInput = screen.getAllByRole("textbox", { name: /windows/i })[0];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "10-12");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updatePremierDelivery).toHaveBeenCalledTimes(1);
    const fd = updatePremierDelivery.mock.calls[0][1] as FormData;
    expect(fd.getAll("regions")).toEqual(["Paris"]);
    expect(fd.getAll("windows")).toEqual(["10-12"]);

    expect(await screen.findByText("Too few regions")).toBeInTheDocument();

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

    const regionsFieldset = screen
      .getByText("Regions")
      .closest("fieldset") as HTMLElement;
    const windowsFieldset = screen
      .getByText("One-hour Windows")
      .closest("fieldset") as HTMLElement;

    await userEvent.click(screen.getByRole("button", { name: /add region/i }));
    expect(within(regionsFieldset).getAllByRole("textbox")).toHaveLength(2);

    const regionInputs = within(regionsFieldset).getAllByRole("textbox");
    await userEvent.type(regionInputs[1], "Berlin");
    await userEvent.click(within(regionsFieldset).getAllByRole("button", { name: /remove/i })[0]);
    expect(within(regionsFieldset).getAllByRole("textbox")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText("Invalid window")).toBeInTheDocument();

    const windowInputs = within(windowsFieldset).getAllByRole("textbox");
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], "11-12");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid window")).not.toBeInTheDocument();
    });
  });
});
