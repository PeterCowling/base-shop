import "@testing-library/jest-dom";

import { act, type ComponentProps, type ReactNode } from "react";
import { render, waitFor } from "@testing-library/react";

import LoansContainer from "../LoansContainer";
import type { LoansTableProps } from "../LoansTable";

/* eslint-disable no-var */
var loansTableProps: LoansTableProps | null;
var addActivityMock: jest.Mock;
var addToAllTransactionsMock: jest.Mock;
var saveLoanMock: jest.Mock;
var removeLoanTransactionsForItemMock: jest.Mock;
var useGuestLoanDataMock: jest.Mock;
var refMock: jest.Mock;
var getMock: jest.Mock;
/* eslint-enable no-var */

const showToastMock = jest.fn();

jest.mock("../LoansTable", () => ({
  __esModule: true,
  LoansTable: (props: LoansTableProps) => {
    loansTableProps = props;
    return <div data-testid="loans-table" />;
  },
}));

jest.mock("../LoanFilters", () => ({
  __esModule: true,
  LoanFilters: (_props: ComponentProps<"div">) => <div data-testid="loan-filters" />,
}));

jest.mock("../useGuestLoanData", () => {
  useGuestLoanDataMock = jest.fn();
  return { __esModule: true, useGuestLoanData: (...args: unknown[]) => useGuestLoanDataMock(...args) };
});

jest.mock("../../common/PageShell", () => ({
  __esModule: true,
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../../context/LoanDataContext", () => {
  saveLoanMock = jest.fn();
  removeLoanTransactionsForItemMock = jest.fn();
  return {
    __esModule: true,
    useLoanData: () => ({
      saveLoan: saveLoanMock,
      removeLoanTransactionsForItem: removeLoanTransactionsForItemMock,
    }),
  };
});

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  addActivityMock = jest.fn();
  return {
    __esModule: true,
    default: () => ({ addActivity: addActivityMock }),
  };
});

jest.mock("../../../hooks/mutations/useAllTransactionsMutations", () => {
  addToAllTransactionsMock = jest.fn();
  return {
    __esModule: true,
    default: () => ({ addToAllTransactions: addToAllTransactionsMock }),
  };
});

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => path);
  getMock = jest.fn();
  return {
    ref: (...args: unknown[]) => refMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  };
});

jest.mock("../../../utils/toastUtils", () => ({
  __esModule: true,
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

const sampleGuests = [
  {
    occupantId: "occ1",
    bookingRef: "BR1",
    firstName: "Alice",
    lastName: "Smith",
  },
];

describe("LoansContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loansTableProps = null;
    useGuestLoanDataMock.mockReturnValue({
      data: sampleGuests,
      loading: false,
      error: null,
    });
    addActivityMock.mockResolvedValue({ success: true });
    addToAllTransactionsMock.mockResolvedValue(undefined);
    saveLoanMock.mockResolvedValue(undefined);
    removeLoanTransactionsForItemMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue({
      exists: () => true,
      forEach: (cb: (snap: { val: () => unknown }) => void) =>
        cb({ val: () => ({ item: "Keycard", type: "Loan", count: 1 }) }),
    });
  });

  it("fails closed on add flow when activity result is success:false", async () => {
    addActivityMock.mockResolvedValueOnce({
      success: false,
      error: "activity failed",
    });

    render(<LoansContainer username="tester" />);
    const props = loansTableProps as NonNullable<typeof loansTableProps>;

    act(() => {
      props.onAddLoan("BR1", "occ1", "Keycard", 1, "CASH");
    });

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("Failed to add loan", "error");
    });
    expect(addToAllTransactionsMock).not.toHaveBeenCalled();
    expect(saveLoanMock).not.toHaveBeenCalled();
  });

  it("awaits saveLoan before removing original loan transactions on return", async () => {
    let resolveSaveLoan: (() => void) | undefined;
    saveLoanMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSaveLoan = resolve;
        })
    );

    render(<LoansContainer username="tester" />);
    const props = loansTableProps as NonNullable<typeof loansTableProps>;

    act(() => {
      props.onReturnLoan("BR1", "occ1", "Keycard", 1);
    });

    await waitFor(() => {
      expect(addToAllTransactionsMock).toHaveBeenCalled();
    });
    expect(removeLoanTransactionsForItemMock).not.toHaveBeenCalled();

    resolveSaveLoan?.();

    await waitFor(() => {
      expect(removeLoanTransactionsForItemMock).toHaveBeenCalledWith(
        "BR1",
        "occ1",
        "Keycard"
      );
    });
  });
});
