import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps } from "react";
import type LoanableItemSelectorType from "../LoanableItemSelector";
import type LoanedItemsListType from "../LoanedItemsList";

/* eslint-disable no-var */
var selectorProps: ComponentProps<typeof LoanableItemSelectorType> | null;
var listProps: ComponentProps<typeof LoanedItemsListType> | null;
var useOccupantLoansMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../LoanableItemSelector", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof LoanableItemSelectorType>) => {
    selectorProps = props;
    return <div data-testid="selector" />;
  },
}));

jest.mock("../LoanedItemsList", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof LoanedItemsListType>) => {
    listProps = props;
    return <div data-testid="list" />;
  },
}));

jest.mock("../useOccupantLoans", () => {
  useOccupantLoansMock = jest.fn();
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
    jest.clearAllMocks();
  });

  it("propagates child callbacks", () => {
    useOccupantLoansMock.mockReturnValue({ occupantLoans: { txns: {} } });

    const onSelectItem = jest.fn();
    const openModal = jest.fn();
    const openKeycardsModal = jest.fn();

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

    const openModal = jest.fn();
    const openKeycardsModal = jest.fn();

    render(
      <table>
        <tbody>
          <GuestRow
            guest={guest}
            guestSelectedItem="Umbrella"
            onSelectItem={jest.fn()}
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

    const openModal = jest.fn();
    const openKeycardsModal = jest.fn();

    render(
      <table>
        <tbody>
          <GuestRow
            guest={guest}
            guestSelectedItem="Umbrella"
            onSelectItem={jest.fn()}
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

