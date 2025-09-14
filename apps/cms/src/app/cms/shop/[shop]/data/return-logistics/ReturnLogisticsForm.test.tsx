import { fireEvent, render, screen, within } from "@testing-library/react";
import ReturnLogisticsForm from "./ReturnLogisticsForm";

jest.mock("@acme/types", () => ({
  returnLogisticsSchema: { safeParse: jest.fn() },
}));

const { returnLogisticsSchema } = require("@acme/types");

describe("ReturnLogisticsForm", () => {
  const base = {
    labelService: "",
    inStore: false,
    dropOffProvider: undefined,
    tracking: undefined,
    bagType: "",
    returnCarrier: [],
    homePickupZipCodes: [],
    mobileApp: undefined,
    requireTags: false,
    allowWear: false,
  } as any;

  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetAllMocks();
    // restore original fetch after each test
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    (global as any).fetch = originalFetch;
  });

  it("shows validation errors when required fields are empty", async () => {
    (returnLogisticsSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: { issues: [{ message: "Required" }] },
    });

    render(<ReturnLogisticsForm shop="test" initial={base} />);
    fireEvent.click(screen.getByText("Save"));

    expect(await screen.findByText("Required")).toBeInTheDocument();
  });

  it("updates carrier and ZIP arrays via add/remove handlers", () => {
    (returnLogisticsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    render(<ReturnLogisticsForm shop="test" initial={base} />);

    const carrierField = screen.getByText("Return Carriers").closest("fieldset")!;
    fireEvent.click(within(carrierField).getByText("Add carrier"));
    let carrierInputs = within(carrierField).getAllByRole("textbox");
    expect(carrierInputs).toHaveLength(2);
    fireEvent.change(carrierInputs[1], { target: { value: "UPS" } });
    fireEvent.click(within(carrierField).getAllByText("Remove")[0]);
    carrierInputs = within(carrierField).getAllByRole("textbox");
    expect(carrierInputs).toHaveLength(1);
    expect(carrierInputs[0]).toHaveValue("UPS");

    const zipField = screen.getByText("Home Pickup ZIPs").closest("fieldset")!;
    fireEvent.click(within(zipField).getByText("Add ZIP"));
    let zipInputs = within(zipField).getAllByRole("textbox");
    expect(zipInputs).toHaveLength(2);
    fireEvent.change(zipInputs[1], { target: { value: "12345" } });
    fireEvent.click(within(zipField).getAllByText("Remove")[0]);
    zipInputs = within(zipField).getAllByRole("textbox");
    expect(zipInputs).toHaveLength(1);
    expect(zipInputs[0]).toHaveValue("12345");
  });

  it("posts sanitized data and shows success", async () => {
    let received: any;
    (returnLogisticsSchema.safeParse as jest.Mock).mockImplementation((data) => {
      received = data;
      return { success: true, data };
    });
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    (global as any).fetch = fetchMock;

    const initial = {
      labelService: "ups",
      inStore: false,
      dropOffProvider: undefined,
      tracking: false,
      bagType: "reusable",
      returnCarrier: ["ups", ""],
      homePickupZipCodes: ["12345", ""],
      mobileApp: undefined,
      requireTags: true,
      allowWear: false,
    } as any;

    render(<ReturnLogisticsForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByText("Save"));

    await screen.findByText("Saved!");

    expect(fetchMock).toHaveBeenCalledWith("/api/data/test/return-logistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(received),
    });
    expect(received.returnCarrier).toEqual(["ups"]);
    expect(received.homePickupZipCodes).toEqual(["12345"]);
  });
});

