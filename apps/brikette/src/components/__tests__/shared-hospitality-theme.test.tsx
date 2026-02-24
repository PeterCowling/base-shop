import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { StaffSignalBadgeGroup } from "@acme/ui";

describe("shared hospitality theme", () => {
  it("TC-02: shared hospitality composite renders with semantic token styles", () => {
    document.documentElement.style.setProperty("--hospitality-ready", "142 76% 97%");
    document.documentElement.style.setProperty("--hospitality-warning", "40 90% 96%");

    render(
      <StaffSignalBadgeGroup
        title="Signal bridge check"
        signals={[
          { id: "eta", label: "ETA shared", ready: true },
          { id: "cash", label: "Cash prepared", ready: false },
        ]}
      />,
    );

    const badgeGroup = screen.getByLabelText("staff-signal-badges");
    const readyBadge = screen.getByText("ETA shared: Ready").closest("span");
    const pendingBadge = screen.getByText("Cash prepared: Pending").closest("span");

    expect(readyBadge).toBeInTheDocument();
    expect(pendingBadge).toBeInTheDocument();
    expect(badgeGroup).toContainElement(readyBadge);
    expect(badgeGroup).toContainElement(pendingBadge);
    expect(readyBadge).toHaveAttribute("data-token", "hospitality-ready");
    expect(pendingBadge).toHaveAttribute("data-token", "hospitality-warning");
  });
});
