/* src/components/till/__tests__/ShiftSummary.test.tsx */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ShiftSummaryProps } from "../../../types/component/Till";
import { ShiftSummary } from "../ShiftSummary";

/**
 * Base properties used across the tests. The values here are chosen to ensure
 * monetary amounts produce predictable two‑decimal formatting. Shallow copies
 * of this object are used in individual test cases to avoid accidental
 * mutation between tests.
 */
const baseProps: ShiftSummaryProps = {
  shiftOpenTime: new Date("2024-01-01T10:00:00Z"),
  shiftOwner: "Alice",
  openingCash: 10,
  finalCashCount: 5,
  netCash: 20,
  netCC: 30,
  docDepositsCount: 1,
  docReturnsCount: 2,
  keycardsLoaned: 3,
  creditSlipTotal: 4,
  keycardsReturned: 5,
  expectedCashAtClose: 60,
  openingKeycards: 4,
  finalKeycardCount: 2,
  expectedKeycardsAtClose: 6,
};

describe("ShiftSummary", () => {
  it("formats all monetary values with two decimals", () => {
    // Render the component with the base properties. Rendering the component
    // directly ensures any memoization layers are exercised and avoids
    // accidentally rendering a null component.
    render(<ShiftSummary {...baseProps} />);

    // Query individual <dt> and <dd> elements to verify that each monetary
    // value is formatted with exactly two decimals. The markup uses a
    // definition list so the label and value are split across sibling
    // elements rather than combined in a single paragraph.
    expect(
      screen.getByText("Opening Cash:", { selector: "dt" })
    ).toBeInTheDocument();
    expect(screen.getByText("€10.00", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByText("Net Cash:", { selector: "dt" })
    ).toBeInTheDocument();
    expect(screen.getByText("€20.00", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Net CC:", { selector: "dt" })).toBeInTheDocument();
    expect(screen.getByText("€30.00", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByText("Credit Slips:", { selector: "dt" })
    ).toBeInTheDocument();
    expect(screen.getByText("€4.00", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByText("Expected Cash at Close:", { selector: "dt" })
    ).toBeInTheDocument();
    expect(screen.getByText("€60.00", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByText("Actual Cash Counted:", { selector: "dt" })
    ).toBeInTheDocument();
    expect(screen.getByText("€5.00", { selector: "dd" })).toBeInTheDocument();
  });

  it("omits actual cash row when finalCashCount is zero", () => {
    // Override the final cash count to zero and render the component. This
    // scenario exercises the conditional rendering path in ShiftSummary that
    // suppresses the "Actual Cash Counted" line entirely.
    const props: ShiftSummaryProps = { ...baseProps, finalCashCount: 0 };
    render(<ShiftSummary {...props} />);

    // Query for the label using a selector that targets the <dt> element
    // specifically. This avoids matching ancestor nodes. Expect it to be
    // absent when final cash count is zero.
    expect(
      screen.queryByText("Actual Cash Counted:", { selector: "dt" })
    ).not.toBeInTheDocument();
  });
});
