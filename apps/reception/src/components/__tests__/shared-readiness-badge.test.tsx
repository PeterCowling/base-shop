import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { StaffSignalBadgeGroup } from "@acme/ui";

describe("shared readiness badge group", () => {
  it("renders staff readiness signals in reception context", () => {
    render(
      <StaffSignalBadgeGroup
        title="Desk readiness signals"
        signals={[
          { id: "eta", label: "ETA shared", ready: true },
          { id: "cash", label: "Cash prepared", ready: false },
        ]}
      />,
    );

    expect(screen.getByText("Desk readiness signals")).toBeInTheDocument();
    expect(screen.getByText("ETA shared: Ready")).toBeInTheDocument();
    expect(screen.getByText("Cash prepared: Pending")).toBeInTheDocument();
  });
});
