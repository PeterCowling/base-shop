import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ComponentProps } from "react";
import type LoanableItemSelectorType from "../LoanableItemSelector";
import type LoanedItemsListType from "../LoanedItemsList";

/* eslint-disable no-var */
var selectorProps: ComponentProps<typeof LoanableItemSelectorType> | null;
var listProps: ComponentProps<typeof LoanedItemsListType> | null;
var useOccupantLoansMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../LoanableItemSelector", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof LoanableItemSelectorType>) => {
    selectorProps = props;
    return <div data-testid="selector" />;
  },
}));

vi.mock("../LoanedItemsList", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof LoanedItemsListType>) => {
    listProps = props;
    return <div data-testid="list" />;
  },
}));

vi.mock("../useOccupantLoans", () => {
  useOccupantLoansMock = vi.fn();
  return { __esModule: true, default: useOccupantLoansMock };
});

import { GuestRow } from "../GuestRow";

describe("GuestRow", () => {
  const guest = {
    guestId: "g1",
    bookingRef: "B1",
    firstName: "Alice",
    lastName: "Smith",
  };

  beforeEach(() => {
    selectorProps = null;
    listProps = null;
    useOccupantLoansMock.mockReset();
    vi.clearAllMocks();
  });

  it("propagates child callbacks", () => {
    useOccupantLoansMock.mockReturnValue({ occupantLoans: { txns: {} } });

    const onSelectItem = vi.fn();
    const openModal = vi.fn();
    const openKeycardsModal = vi.fn();

    render(
      <table>
        <tbody>
          <GuestRow
            guest={guest}
            guestSelectedItem="Umbrella"
            onSelectItem={onSelectItem}
            buttonDisabled={false}
            openModal={openModal}
            openKeycardsModal={openKeycardsModal}
            rowBg=""
          />
        </tbody>
      </table>
    );

    selectorProps?.onSelectItem("Padlock");
    expect(onSelectItem).toHaveBeenCalledWith("g1", "Padlock");

    selectorProps?.openModal("loan", guest, "Umbrella", 3, "CASH");
    expect(openModal).toHaveBeenNthCalledWith(
      1,
      "loan",
      guest,
      "Umbrella",
      3,
      "CASH"
    );

    listProps?.onReturnLoan("B1", "g1", "Keycard", 2);
    expect(openModal).toHaveBeenNthCalledWith(
      2,
      "return",
      guest,
      "Keycard",
      2
    );
  });

  it("opens keycards modal on double click when keycards exist", async () => {
    useOccupantLoansMock.mockReturnValue({
      occupantLoans: {
        txns: {
          T1: {
            count: 1,
            createdAt: "2024-01-01",
            depositType: "CASH",
            deposit: 0,
            item: "Keycard",
            type: "Loan",
          },
        },
      },
    });

    const openModal = vi.fn();
    const openKeycardsModal = vi.fn();

    render(
      <table>
        <tbody>
          <GuestRow
            guest={guest}
            guestSelectedItem="Umbrella"
            onSelectItem={vi.fn()}
            buttonDisabled={false}
            openModal={openModal}
            openKeycardsModal={openKeycardsModal}
            rowBg=""
          />
        </tbody>
      </table>
    );

    const row = screen.getByRole("row");
    await userEvent.dblClick(row);
    expect(openKeycardsModal).toHaveBeenCalledWith(guest);
  });

  it("does not open keycards modal when none exist", async () => {
    useOccupantLoansMock.mockReturnValue({ occupantLoans: { txns: {} } });

    const openModal = vi.fn();
    const openKeycardsModal = vi.fn();

    render(
      <table>
        <tbody>
          <GuestRow
            guest={guest}
            guestSelectedItem="Umbrella"
            onSelectItem={vi.fn()}
            buttonDisabled={false}
            openModal={openModal}
            openKeycardsModal={openKeycardsModal}
            rowBg=""
          />
        </tbody>
      </table>
    );

    const row = screen.getByRole("row");
    await userEvent.dblClick(row);
    expect(openKeycardsModal).not.toHaveBeenCalled();
  });
});

