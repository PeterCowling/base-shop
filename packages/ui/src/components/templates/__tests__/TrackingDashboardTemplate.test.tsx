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

const stats = [{ label: "Shipments", value: "1" }];

describe("TrackingDashboardTemplate", () => {
  it("renders records and stats grid", () => {
    render(
      <TrackingDashboardTemplate records={records} stats={stats} />,
    );
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Shipments")).toBeInTheDocument();
  });

  it("does not render stats grid when stats array is empty", () => {
    const { container } = render(
      <TrackingDashboardTemplate records={records} stats={[]} />,
    );
    expect(container.querySelector(".grid")).toBeNull();
  });
});
