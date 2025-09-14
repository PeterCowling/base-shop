/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import PickupPage from "../src/app/returns/pickup/page";

jest.mock("@platform-core/returnLogistics", () => ({
  getReturnBagAndLabel: jest.fn(),
}));
const rl = jest.requireMock("@platform-core/returnLogistics");

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: jest.fn(),
  readShop: jest.fn(),
}));
const shops = jest.requireMock("@platform-core/repositories/shops.server");

jest.mock("../src/components/CleaningInfo", () => () => <div data-cy="cleaning" />);

describe("PickupPage", () => {
  it("confirms scheduling for allowed zip", async () => {
    rl.getReturnBagAndLabel.mockResolvedValue({ homePickupZipCodes: ["123"] });
    shops.getShopSettings.mockResolvedValue({ returnService: { homePickupEnabled: true } });
    shops.readShop.mockResolvedValue({ showCleaningTransparency: true });
    render((await PickupPage({ searchParams: Promise.resolve({ zip: "123" }) })) as any);
    expect(screen.getByText(/scheduled for ZIP 123/)).toBeInTheDocument();
    expect(screen.getByTestId("cleaning")).toBeInTheDocument();
  });

  it("shows form when zip missing", async () => {
    rl.getReturnBagAndLabel.mockResolvedValue({ homePickupZipCodes: ["123"] });
    shops.getShopSettings.mockResolvedValue({ returnService: { homePickupEnabled: true } });
    shops.readShop.mockResolvedValue({ showCleaningTransparency: false });
    render((await PickupPage({ searchParams: Promise.resolve({}) })) as any);
    expect(screen.getByPlaceholderText("ZIP code")).toBeInTheDocument();
  });
});

