/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import MobileReturnPage from "../src/app/returns/mobile/page";

jest.mock("@platform-core/returnLogistics", () => ({
  getReturnLogistics: jest.fn(),
  getReturnBagAndLabel: jest.fn(),
}));
const rl = jest.requireMock("@platform-core/returnLogistics");

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: jest.fn(),
  readShop: jest.fn(),
}));
const shops = jest.requireMock("@platform-core/repositories/shops.server");

jest.mock("../src/components/CleaningInfo", () => {
  function CleaningInfoMock() {
    return <div data-cy="cleaning" />;
  }
  return CleaningInfoMock;
});
jest.mock("../src/app/returns/mobile/Scanner", () => {
  function ScannerMock() {
    return <div data-cy="scanner" />;
  }
  return ScannerMock;
});

describe("MobileReturnPage", () => {
  it("shows disabled message when mobile app off", async () => {
    rl.getReturnLogistics.mockResolvedValue({ mobileApp: false });
    rl.getReturnBagAndLabel.mockResolvedValue({});
    shops.getShopSettings.mockResolvedValue({});
    shops.readShop.mockResolvedValue({});
    render((await MobileReturnPage()) as any);
    expect(screen.getByText(/not enabled/)).toBeInTheDocument();
  });

  it("renders scanner and cleaning info", async () => {
    rl.getReturnLogistics.mockResolvedValue({ mobileApp: true });
    rl.getReturnBagAndLabel.mockResolvedValue({ homePickupZipCodes: ["1"] });
    shops.getShopSettings.mockResolvedValue({ returnService: { homePickupEnabled: true } });
    shops.readShop.mockResolvedValue({ showCleaningTransparency: true });
    render((await MobileReturnPage()) as any);
    expect(screen.getByTestId("scanner")).toBeInTheDocument();
    expect(screen.getByTestId("cleaning")).toBeInTheDocument();
  });
});
