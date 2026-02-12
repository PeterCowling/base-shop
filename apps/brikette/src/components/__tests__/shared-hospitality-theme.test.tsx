import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { StaffSignalBadgeGroup } from "@acme/ui";

describe("shared hospitality theme", () => {
  it("TC-02: shared hospitality composite renders with semantic token styles", () => {
    render(
      <StaffSignalBadgeGroup
        title="Signal bridge check"
        signals={[
          { id: "eta", label: "ETA shared", ready: true },
          { id: "cash", label: "Cash prepared", ready: false },
        ]}
      />,
    );

    const readyBadge = screen.getByText("ETA shared: Ready");
    const pendingBadge = screen.getByText("Cash prepared: Pending");

    expect(readyBadge).toBeInTheDocument();
    expect(pendingBadge).toBeInTheDocument();
    expect(readyBadge).toHaveStyle({ backgroundColor: "hsl(var(--hospitality-ready))" });
    expect(pendingBadge).toHaveStyle({ backgroundColor: "hsl(var(--hospitality-warning))" });
  });
});
