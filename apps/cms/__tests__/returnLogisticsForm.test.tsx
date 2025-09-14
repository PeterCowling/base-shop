import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";

const mockCheckShopExists = jest.fn();
const mockReadReturnLogistics = jest.fn();

jest.mock("@acme/lib", () => ({
  checkShopExists: (...args: any[]) => mockCheckShopExists(...args),
}));
jest.mock("@platform-core/repositories/returnLogistics.server", () => ({
  readReturnLogistics: (...args: any[]) => mockReadReturnLogistics(...args),
}));

jest.mock("@ui/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Input: (props: any) => <input {...props} />,
  Checkbox: ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(e) =>
        onCheckedChange?.((e.target as HTMLInputElement).checked)
      }
      {...props}
    />
  ),
}));

import ReturnLogisticsPage from "../src/app/cms/shop/[shop]/data/return-logistics/page";

const initial = {
  labelService: "ups",
  inStore: false,
  dropOffProvider: undefined,
  tracking: false,
  bagType: "reusable",
  returnCarrier: [],
  homePickupZipCodes: [],
  mobileApp: false,
  requireTags: false,
  allowWear: false,
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
  mockCheckShopExists.mockResolvedValue(true);
  mockReadReturnLogistics.mockResolvedValue(initial);
});

describe("ReturnLogisticsForm", () => {
  it("adds and removes carriers and ZIP codes", async () => {
    const Page = await ReturnLogisticsPage({
      params: Promise.resolve({ shop: "s1" }),
    });
    render(Page);

    const carrierFieldset = screen
      .getByText("Return Carriers")
      .closest("fieldset")!;
    expect(within(carrierFieldset).getAllByRole("textbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add carrier/i }));
    expect(within(carrierFieldset).getAllByRole("textbox")).toHaveLength(2);
    fireEvent.click(
      within(carrierFieldset).getAllByRole("button", { name: /remove/i })[0]
    );
    expect(within(carrierFieldset).getAllByRole("textbox")).toHaveLength(1);

    const zipFieldset = screen
      .getByText("Home Pickup ZIPs")
      .closest("fieldset")!;
    expect(within(zipFieldset).getAllByRole("textbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add zip/i }));
    expect(within(zipFieldset).getAllByRole("textbox")).toHaveLength(2);
    fireEvent.click(
      within(zipFieldset).getAllByRole("button", { name: /remove/i })[0]
    );
    expect(within(zipFieldset).getAllByRole("textbox")).toHaveLength(1);
  });

  it("toggles checkboxes", async () => {
    const Page = await ReturnLogisticsPage({
      params: Promise.resolve({ shop: "s1" }),
    });
    render(Page);

    const inStore = screen.getByLabelText("Allow in-store returns");
    const tracking = screen.getByLabelText("Enable tracking numbers");
    const requireTags = screen.getByLabelText("Require tags for returns");
    const allowWear = screen.getByLabelText("Allow signs of wear");
    const mobileApp = screen.getByLabelText("Enable mobile returns");

    fireEvent.click(inStore);
    fireEvent.click(tracking);
    fireEvent.click(requireTags);
    fireEvent.click(allowWear);
    fireEvent.click(mobileApp);

    expect(inStore).toBeChecked();
    expect(tracking).toBeChecked();
    expect(requireTags).toBeChecked();
    expect(allowWear).toBeChecked();
    expect(mobileApp).toBeChecked();
  });

  it("handles validation errors", async () => {
    const Page = await ReturnLogisticsPage({
      params: Promise.resolve({ shop: "s1" }),
    });
    render(Page);

    fireEvent.change(screen.getByLabelText("Label Service"), {
      target: { value: "fedex" },
    });
    fireEvent.change(screen.getByLabelText("Bag Type"), {
      target: { value: "plastic" },
    });
    const carrierFieldset = screen
      .getByText("Return Carriers")
      .closest("fieldset")!;
    fireEvent.change(within(carrierFieldset).getByRole("textbox"), {
      target: { value: "fedex" },
    });
    const zipFieldset = screen
      .getByText("Home Pickup ZIPs")
      .closest("fieldset")!;
    fireEvent.change(within(zipFieldset).getByRole("textbox"), {
      target: { value: "123" },
    });

    const form = screen.getByRole("button", { name: /save/i }).closest("form")!;
    fireEvent.submit(form);
    expect(screen.getByText(/invalid literal value/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

