import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TrackingDashboardTemplate } from "../TrackingDashboardTemplate";

const records = [
  {
    id: "1",
    type: "shipment",
    provider: "ups",
    status: "Delivered",
    updated: "2024-01-01",
  },
];

describe("TrackingDashboardTemplate", () => {
  it("renders records", () => {
    render(<TrackingDashboardTemplate records={records} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });
});
