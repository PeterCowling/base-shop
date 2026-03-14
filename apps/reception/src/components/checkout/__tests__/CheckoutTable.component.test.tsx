// src/components/checkout/__tests__/CheckoutTable.component.test.tsx
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Guest } from "../CheckoutTable";
import CheckoutTable from "../CheckoutTable";

// ------------ hoist‑safe declaration ---------------------------
/* eslint-disable no-var */
var sortCheckoutsDataMock: jest.Mock;
/* eslint-enable  no-var */
// ---------------------------------------------------------------

jest.mock("../../../utils/sortCheckouts", () => {
  sortCheckoutsDataMock = jest.fn();
  return {
    sortCheckoutsData: (...args: unknown[]) => sortCheckoutsDataMock(...args),
  };
});

describe("CheckoutTable component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows message when no guests", () => {
    render(
      <CheckoutTable
        guests={[]}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
      />
    );

    expect(screen.getByText(/no checkouts found/i)).toBeInTheDocument();
    expect(sortCheckoutsDataMock).not.toHaveBeenCalled();
  });

  it("enters confirm mode on first loan click, calls removeLoanItem on confirm", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: { L1: { item: "Umbrella" } },
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const removeLoanItem = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={removeLoanItem}
        onComplete={jest.fn()}
      />
    );

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    await userEvent.click(loanBtn);

    // After first click: confirm mode — removeLoanItem not called yet
    expect(removeLoanItem).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /remove umbrella/i })).not.toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm remove umbrella/i });
    await userEvent.click(confirmBtn);

    expect(removeLoanItem).toHaveBeenCalledWith(
      "BR1",
      "G1",
      "L1",
      "Umbrella",
      undefined
    );
  });

  it("cancels loan removal when cancel button is clicked", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: { L1: { item: "Umbrella" } },
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const removeLoanItem = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={removeLoanItem}
        onComplete={jest.fn()}
      />
    );

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    await userEvent.click(loanBtn);

    const cancelBtn = screen.getByRole("button", { name: /cancel remove umbrella/i });
    await userEvent.click(cancelBtn);

    // Should return to normal state; original button visible again
    expect(screen.getByRole("button", { name: /remove umbrella/i })).toBeInTheDocument();
    expect(removeLoanItem).not.toHaveBeenCalled();
  });

  it("calls onComplete when complete button clicked", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: { L1: { item: "Umbrella" } },
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const onComplete = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={onComplete}
      />
    );

    const completeBtn = screen.getByRole("button", {
      name: /complete checkout/i,
    });
    await userEvent.click(completeBtn);

    expect(onComplete).toHaveBeenCalledWith(
      "BR1",
      "G1",
      false,
      "2025-01-01"
    );
  });

  it("shows fridge toggle button highlighted when fridgeUsed is true", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        bagStorageOptedIn: true,
        fridgeUsed: true,
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
        onToggleFridge={jest.fn()}
      />
    );

    const fridgeBtn = screen.getByRole("button", { name: /toggle fridge storage for G1/i });
    expect(fridgeBtn).toBeInTheDocument();
    expect(fridgeBtn.className).toContain("text-primary-main");
    expect(fridgeBtn).toHaveAttribute("title", "Unmark fridge used");
  });

  it("shows fridge toggle button muted when fridgeUsed is false or undefined", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        fridgeUsed: false,
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
        onToggleFridge={jest.fn()}
      />
    );

    const fridgeBtn = screen.getByRole("button", { name: /toggle fridge storage for G1/i });
    expect(fridgeBtn.className).toContain("text-muted-foreground");
    expect(fridgeBtn).toHaveAttribute("title", "Mark fridge used");
  });

  it("disables fridge toggle button when occupantId is in pendingFridgeOccupantIds", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
        onToggleFridge={jest.fn()}
        pendingFridgeOccupantIds={new Set(["G1"])}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle fridge storage for G1/i });
    expect(toggleBtn).toBeDisabled();
  });

  it("calls onToggleFridge when fridge toggle button is clicked", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        fridgeUsed: false,
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const onToggleFridge = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
        onToggleFridge={onToggleFridge}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle fridge storage for G1/i });
    await userEvent.click(toggleBtn);

    expect(onToggleFridge).toHaveBeenCalledWith("G1", "BR1", false);
  });

  it("calls onToggleBagStorage when bag storage toggle button is clicked", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        bagStorageOptedIn: false,
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const onToggleBagStorage = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
        onToggleBagStorage={onToggleBagStorage}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /toggle bag storage for G1/i });
    await userEvent.click(toggleBtn);

    expect(onToggleBagStorage).toHaveBeenCalledWith("G1", "BR1", false);
  });

  it("shows completed state with Undo label and calls onComplete with true", async () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        isCompleted: true,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);
    const onComplete = jest.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={jest.fn()}
        onComplete={onComplete}
      />
    );

    const completeBtn = screen.getByRole("button", {
      name: /undo checkout completion/i,
    });
    expect(completeBtn).toHaveTextContent(/undo/i);

    await userEvent.click(completeBtn);

    expect(onComplete).toHaveBeenCalledWith(
      "BR1",
      "G1",
      true,
      "2025-01-01"
    );
  });

  it("renders guests in the sorted order returned by sortCheckoutsData", () => {
    const guestA: Guest = {
      bookingRef: "BR1",
      guestId: "G1",
      checkoutDate: "2025-01-01",
      firstName: "Alice",
      lastName: "Smith",
      roomAllocated: "101",
      loans: {},
      isCompleted: false,
    };
    const guestB: Guest = {
      bookingRef: "BR2",
      guestId: "G2",
      checkoutDate: "2025-01-02",
      firstName: "Bob",
      lastName: "Brown",
      roomAllocated: "102",
      loans: {},
      isCompleted: false,
    };

    sortCheckoutsDataMock.mockReturnValue([guestB, guestA]);

    render(
      <CheckoutTable
        guests={[guestA, guestB]}
        removeLoanItem={jest.fn()}
        onComplete={jest.fn()}
      />
    );

    const rows = screen.getAllByRole("row");
    // first row is header, next should match sorted order
    expect(rows[1]).toHaveTextContent("BR2");
    expect(rows[2]).toHaveTextContent("BR1");
    expect(sortCheckoutsDataMock).toHaveBeenCalledWith([guestA, guestB]);
  });

  it("applies dark mode classes when html has dark", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: {},
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    document.documentElement.classList.add("dark");
    const { container } = render(
      <CheckoutTable guests={guests} removeLoanItem={jest.fn()} onComplete={jest.fn()} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-surface");
    document.documentElement.classList.remove("dark");
  });

  it("applies token color to loan buttons in dark mode", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        checkoutDate: "2025-01-01",
        firstName: "Alice",
        lastName: "Smith",
        roomAllocated: "101",
        loans: { L1: { item: "Umbrella" } },
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    document.documentElement.classList.add("dark");
    render(
      <CheckoutTable guests={guests} removeLoanItem={jest.fn()} onComplete={jest.fn()} />
    );

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    expect(loanBtn.className).toContain("text-foreground");
    expect(loanBtn.className).toContain("hover:text-foreground");
    document.documentElement.classList.remove("dark");
  });
});
