import React from "react";
import { render, screen } from "@testing-library/react";

// Provide lightweight renderable shadcn atoms so children text is visible
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const Passthrough = ({ children, asChild, ...rest }: any) =>
    React.createElement("div", rest, children);
  const Progress = ({ label, labelClassName, className }: any) => (
    <div className={className}>
      <div />
      {label ? <div className={labelClassName}>{label}</div> : null}
    </div>
  );
  return {
    __esModule: true,
    Button: Passthrough,
    Card: Passthrough,
    CardContent: Passthrough,
    Tag: ({ children }: any) => React.createElement("span", { role: "status" }, children),
    Progress,
  };
});

// Next/link mocked globally in jest.setup via test/resetNextMocks.ts

import { ShopOverviewCard } from "../ShopOverviewCard";
import { PendingSummaryPanel } from "../PendingSummaryPanel";
import { DashboardHero } from "../DashboardHero";

const makeStats = (overrides?: Partial<{ users: number; shops: number; products: number }>) => ({
  users: 0,
  shops: 0,
  products: 0,
  ...(overrides || {}),
});

describe("dashboard overview cards", () => {
  it("ShopOverviewCard renders empty-state messaging and tags", () => {
    render(<ShopOverviewCard stats={makeStats()} pendingCount={0} />);

    expect(screen.getByText("Shop overview")).toBeInTheDocument();
    expect(screen.getByText("No storefronts live yet")).toBeInTheDocument();
    expect(screen.getByText("Start importing products")).toBeInTheDocument();
    expect(
      screen.getByText("Invite collaborators to share the workload")
    ).toBeInTheDocument();

    // Tag labels are rendered as plain text via mocked atoms
    expect(screen.getByText("Needs setup")).toBeInTheDocument();
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("ShopOverviewCard pluralises counts and pending label", () => {
    render(
      <ShopOverviewCard
        stats={makeStats({ shops: 2, products: 10, users: 1 })}
        pendingCount={3}
      />
    );

    expect(screen.getByText("2 shops ready for merchandising")).toBeInTheDocument();
    expect(screen.getByText("10 items available across all shops")).toBeInTheDocument();
    expect(screen.getByText("1 active member")).toBeInTheDocument();

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Populated")).toBeInTheDocument();
    expect(screen.getByText("3 pending")).toBeInTheDocument();
  });

  it("PendingSummaryPanel wires heading id and copy", () => {
    render(<PendingSummaryPanel headingId="pending-requests" />);
    const heading = screen.getByText("Account requests");
    expect(heading).toHaveAttribute("id", "pending-requests");
    // tabindex is set to -1 for focus scroll target
    expect((heading as HTMLElement).getAttribute("tabindex")).toBe("-1");
    expect(
      screen.getByText(
        "Only administrators can approve new accounts. Reach out to an admin if someone is waiting for access."
      )
    ).toBeInTheDocument();
  });

  it("DashboardHero toggles descriptions, buttons and pending summary", () => {
    const { rerender } = render(
      <DashboardHero
        stats={makeStats({ shops: 0, users: 0, products: 0 })}
        pendingCount={0}
        canManageRequests={true}
        pendingHeadingId="pending-requests"
      />
    );

    expect(
      screen.getByText(
        "Create your first shop to unlock dashboards, live previews, and automated maintenance."
      )
    ).toBeInTheDocument();
    // Buttons visible when canManageRequests
    expect(screen.getByText("Create new shop")).toBeInTheDocument();
    expect(screen.queryByText("Review account requests")).not.toBeInTheDocument();
    expect(screen.getByText("No pending approvals")).toBeInTheDocument();

    // With shops > 0 and pending > 0 shows different description and jump link
    rerender(
      <DashboardHero
        stats={makeStats({ shops: 3, users: 5, products: 7 })}
        pendingCount={2}
        canManageRequests={true}
        pendingHeadingId="pending-requests"
      />
    );
    expect(
      screen.getByText(
        "Monitor storefront performance, team access, and catalog health from a single control centre."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Review account requests")).toBeInTheDocument();
    expect(screen.getByText("2 awaiting review")).toBeInTheDocument();
  });
});
