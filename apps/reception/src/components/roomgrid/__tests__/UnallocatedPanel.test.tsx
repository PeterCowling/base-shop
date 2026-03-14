import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import type { UnallocatedOccupant } from "../../../hooks/data/roomgrid/useGridData";
import UnallocatedPanel from "../UnallocatedPanel";

// Mock DS primitives to plain divs so the component renders without
// the full design-system setup.
jest.mock("@acme/design-system/primitives", () => ({
  Stack: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="ds-stack" {...rest}>{children}</div>
  ),
  Inline: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="ds-inline" {...rest}>{children}</div>
  ),
  Cluster: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="ds-cluster" {...rest}>{children}</div>
  ),
}));

// statusColors must return something so the colour swatch renders.
jest.mock("../constants/statusColors", () => ({
  statusColors: new Proxy(
    {},
    { get: () => "var(--test-color)" }
  ),
}));

const makeOccupant = (overrides: Partial<UnallocatedOccupant> = {}): UnallocatedOccupant => ({
  bookingRef: "BR-TEST",
  occupantId: "OCC-1",
  firstName: "Alice",
  lastName: "Smith",
  checkInDate: "2025-06-01",
  checkOutDate: "2025-06-05",
  bookedRoom: "6",
  status: "1",
  ...overrides,
});

describe("UnallocatedPanel", () => {
  // TC-05: renders correctly for a single occupant
  it("TC-05: renders occupant name, booking ref, and dates for a single occupant", () => {
    render(<UnallocatedPanel occupants={[makeOccupant()]} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("BR-TEST")).toBeInTheDocument();
    expect(screen.getByText("2025-06-01")).toBeInTheDocument();
    expect(screen.getByText("2025-06-05")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  // TC-06: renders "—" when bookedRoom is undefined
  it("TC-06: renders dash when bookedRoom is undefined", () => {
    render(<UnallocatedPanel occupants={[makeOccupant({ bookedRoom: undefined })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders multiple occupants — all rows present", () => {
    const occupants = [
      makeOccupant({ occupantId: "OCC-1", firstName: "Alice", lastName: "Smith", bookingRef: "BR-1" }),
      makeOccupant({ occupantId: "OCC-2", firstName: "Bob", lastName: "Jones", bookingRef: "BR-2" }),
    ];
    render(<UnallocatedPanel occupants={occupants} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("BR-1")).toBeInTheDocument();
    expect(screen.getByText("BR-2")).toBeInTheDocument();
    expect(screen.getAllByData_cy("unallocated-row")).toHaveLength(2);
  });

  it("shows count badge with number of unallocated occupants", () => {
    const occupants = [makeOccupant(), makeOccupant({ occupantId: "OCC-2", bookingRef: "BR-2" })];
    render(<UnallocatedPanel occupants={occupants} />);
    // The count badge shows occupants.length
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders Unknown when firstName and lastName are both empty", () => {
    render(
      <UnallocatedPanel
        occupants={[makeOccupant({ firstName: "", lastName: "" })]}
      />
    );
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
