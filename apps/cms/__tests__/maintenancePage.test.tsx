import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MaintenancePage from "../src/app/cms/maintenance/page";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, asChild, ...props }: any) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    CardContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    Progress: ({ label }: any) =>
      React.createElement("div", { role: label ? "progressbar" : undefined }, label ?? null),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

const mockScanForMaintenance = jest.fn();
const mockRunMaintenanceCheck = jest.fn();

jest.mock("../src/app/cms/maintenance/scan.server", () => ({
  scanForMaintenance: (...args: unknown[]) => mockScanForMaintenance(...args),
  runMaintenanceCheck: (...args: unknown[]) => mockRunMaintenanceCheck(...args),
}));

describe("MaintenancePage", () => {
  beforeEach(() => {
    mockScanForMaintenance.mockResolvedValue([
      { shopId: "demo-shop", sku: "SKU123", message: "item needs maintenance" },
    ]);
    mockRunMaintenanceCheck.mockResolvedValue([]);
  });

  it("renders scan actions and updates status after rerun", async () => {
    render(await MaintenancePage());

    expect(
      screen.getByRole("heading", { name: /keep your catalog clean and compliant/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/demo-shop/i)).toBeInTheDocument();
    const runButton = screen.getByRole("button", { name: /run scan again/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(mockRunMaintenanceCheck).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/no items currently require maintenance/i)
    ).toBeInTheDocument();
  });
});
