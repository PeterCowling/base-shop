import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import TodayMovements, { type TodayMovementEntry } from "../TodayMovements";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function makeEntry(
  room: string,
  occupantId: string,
  firstName: string,
  lastName: string
): TodayMovementEntry {
  return { room, occupantId, firstName, lastName };
}

/* -------------------------------------------------------------------------- */
/* TC-01: Arrivals list                                                       */
/* -------------------------------------------------------------------------- */

describe("TodayMovements — arrivals", () => {
  it("TC-01: renders arriving guests with room number and name", () => {
    const arrivals: TodayMovementEntry[] = [
      makeEntry("3", "OCC-1", "Alice", "Smith"),
      makeEntry("5", "OCC-2", "Bob", "Jones"),
    ];
    render(<TodayMovements arrivals={arrivals} departures={[]} />);

    expect(screen.getByText("Arriving today")).toBeInTheDocument();
    expect(screen.getByText("Room 3")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Room 5")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/* TC-02: Departures list                                                     */
/* -------------------------------------------------------------------------- */

describe("TodayMovements — departures", () => {
  it("TC-02: renders departing guests with room number and name", () => {
    const departures: TodayMovementEntry[] = [
      makeEntry("10", "OCC-3", "Carol", "White"),
    ];
    render(<TodayMovements arrivals={[]} departures={departures} />);

    expect(screen.getByText("Departing today")).toBeInTheDocument();
    expect(screen.getByText("Room 10")).toBeInTheDocument();
    expect(screen.getByText("Carol White")).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/* TC-03: Empty state                                                         */
/* -------------------------------------------------------------------------- */

describe("TodayMovements — empty state", () => {
  it("TC-03: renders 'No movements today' when both lists are empty", () => {
    render(<TodayMovements arrivals={[]} departures={[]} />);

    expect(screen.getByText("No movements today")).toBeInTheDocument();
    expect(screen.queryByText("Arriving today")).not.toBeInTheDocument();
    expect(screen.queryByText("Departing today")).not.toBeInTheDocument();
  });

  it("TC-03b: renders 'No arrivals today' when only departures are present", () => {
    const departures: TodayMovementEntry[] = [
      makeEntry("7", "OCC-4", "Dave", "Green"),
    ];
    render(<TodayMovements arrivals={[]} departures={departures} />);

    expect(screen.getByText("No arrivals today")).toBeInTheDocument();
    expect(screen.getByText("Departing today")).toBeInTheDocument();
  });

  it("TC-03c: renders 'No departures today' when only arrivals are present", () => {
    const arrivals: TodayMovementEntry[] = [
      makeEntry("4", "OCC-5", "Eve", "Brown"),
    ];
    render(<TodayMovements arrivals={arrivals} departures={[]} />);

    expect(screen.getByText("Arriving today")).toBeInTheDocument();
    expect(screen.getByText("No departures today")).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/* TC-04: Unknown guest name fallback                                         */
/* -------------------------------------------------------------------------- */

describe("TodayMovements — guest name fallback", () => {
  it("TC-04: renders 'Unknown' when both firstName and lastName are empty", () => {
    const arrivals: TodayMovementEntry[] = [
      makeEntry("6", "OCC-6", "", ""),
    ];
    render(<TodayMovements arrivals={arrivals} departures={[]} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("TC-04b: renders partial name when only firstName is present", () => {
    const arrivals: TodayMovementEntry[] = [
      makeEntry("9", "OCC-7", "Frank", ""),
    ];
    render(<TodayMovements arrivals={arrivals} departures={[]} />);

    expect(screen.getByText("Frank")).toBeInTheDocument();
  });

  it("TC-04c: renders partial name when only lastName is present", () => {
    const departures: TodayMovementEntry[] = [
      makeEntry("11", "OCC-8", "", "Taylor"),
    ];
    render(<TodayMovements arrivals={[]} departures={departures} />);

    expect(screen.getByText("Taylor")).toBeInTheDocument();
  });
});
