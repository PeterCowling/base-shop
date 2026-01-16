// src/components/checkout/__tests__/CheckoutTable.component.test.tsx
/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Guest } from "../CheckoutTable";

// ------------ hoist‑safe declaration ---------------------------
/* eslint-disable no-var */
var sortCheckoutsDataMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */
// ---------------------------------------------------------------

vi.mock("../../../utils/sortCheckouts", () => {
  sortCheckoutsDataMock = vi.fn();
  return {
    sortCheckoutsData: (...args: unknown[]) => sortCheckoutsDataMock(...args),
  };
});

import CheckoutTable from "../CheckoutTable";

describe("CheckoutTable component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows message when no guests", () => {
    render(
      <CheckoutTable
        guests={[]}
        removeLoanItem={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText(/no checkouts found/i)).toBeInTheDocument();
    expect(sortCheckoutsDataMock).not.toHaveBeenCalled();
  });

  it("calls removeLoanItem when loan button clicked", async () => {
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
    const removeLoanItem = vi.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={removeLoanItem}
        onComplete={vi.fn()}
      />
    );

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    await userEvent.click(loanBtn);

    expect(removeLoanItem).toHaveBeenCalledWith(
      "BR1",
      "G1",
      "L1",
      "Umbrella",
      undefined
    );
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
    const onComplete = vi.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={vi.fn()}
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

  it("shows bag storage icon and fridge text", () => {
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
        fridge: "Milk",
        isCompleted: false,
      },
    ];
    sortCheckoutsDataMock.mockReturnValue(guests);

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByTitle(/bag storage/i)).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
  });

  it("shows completed state and calls onComplete with true", async () => {
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
    const onComplete = vi.fn();

    render(
      <CheckoutTable
        guests={guests}
        removeLoanItem={vi.fn()}
        onComplete={onComplete}
      />
    );

    const completeBtn = screen.getByRole("button", {
      name: /undo checkout completion/i,
    });
    expect(completeBtn).toHaveTextContent(/completed/i);

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
        removeLoanItem={vi.fn()}
        onComplete={vi.fn()}
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
      <CheckoutTable guests={guests} removeLoanItem={vi.fn()} onComplete={vi.fn()} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("applies dark accent color to loan buttons in dark mode", () => {
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
      <CheckoutTable guests={guests} removeLoanItem={vi.fn()} onComplete={vi.fn()} />
    );

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    expect(loanBtn.className).toContain("dark:text-darkAccentGreen");
    expect(loanBtn.className).toContain("dark:hover:text-darkAccentGreen");
    document.documentElement.classList.remove("dark");
  });
});
