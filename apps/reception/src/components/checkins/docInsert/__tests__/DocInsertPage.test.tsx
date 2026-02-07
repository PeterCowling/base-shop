import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { OccupantDetails } from "../../../../types/hooks/data/guestDetailsData";
// ------------------------------------------------------------------
// Component under test (imported after mocks)
// ------------------------------------------------------------------
import DocInsertPage from "../DocInsertPage";
import Row1 from "../row1";

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------

const navigateMock = jest.fn();
const saveFieldMock = jest.fn().mockResolvedValue(undefined);
const logActivityMock = jest.fn();
const occupantIsCompleteMock = jest.fn();
const showToastMock = jest.fn();

const baseOccupant: OccupantDetails = {
  firstName: "John",
  lastName: "Doe",
  gender: "M",
  placeOfBirth: "City",
  citizenship: "Country",
  municipality: "Town",
  document: { number: "ABC", type: "Passport" },
  dateOfBirth: { yyyy: "1990", mm: "01", dd: "01" },
  allocated: "101",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigateMock }),
  useSearchParams: () =>
    new URLSearchParams({
      bookingRef: "BR1",
      occupantId: "O1",
      selectedDate: "2025-01-01",
    }),
}));

jest.mock("../../../../hooks/data/useSingleGuestDetails", () => ({
  __esModule: true,
  default: () => ({
    occupantDetails: baseOccupant,
    loading: false,
    error: null,
    saveField: saveFieldMock,
  }),
}));

jest.mock("../../../../hooks/mutations/useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({ logActivity: logActivityMock }),
}));

jest.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

jest.mock("../row2", () => ({
  __esModule: true,
  default: () => <div>row2</div>,
}));
jest.mock("../row3", () => ({
  __esModule: true,
  default: () => <div>row3</div>,
}));
jest.mock("../BookingRef", () => ({
  __esModule: true,
  default: ({ bookingRef }: { bookingRef: string }) => (
    <div>booking-{bookingRef}</div>
  ),
}));

jest.mock("../occupantCompleteHelpers", () => ({
  occupantIsComplete: occupantIsCompleteMock,
}));

jest.mock("../../../../utils/toastUtils", () => ({
  showToast: showToastMock,
}));

// ------------------------------------------------------------------
// Test suites
// ------------------------------------------------------------------

describe("DocInsertPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    occupantIsCompleteMock.mockReturnValue(true);
  });

  it("updates first name and logs activity", async () => {
    render(<DocInsertPage />);

    const first = screen.getByLabelText(/first name/i);
    expect(first).toHaveValue("John");

    await userEvent.clear(first);
    await userEvent.type(first, "Jane");
    await userEvent.tab();

    expect(saveFieldMock).toHaveBeenCalledWith("firstName", "Jane");
    expect(
      screen.getByText(/firstName updated successfully!/i)
    ).toBeInTheDocument();
    expect(logActivityMock).toHaveBeenCalledWith("O1", 11);
  });
});

describe("Row1 validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("capitalizes input and saves on blur", async () => {
    const saveField = jest.fn().mockResolvedValue(undefined);
    render(
      <Row1
        occupantDetails={{ firstName: "", lastName: "", gender: "" }}
        saveField={saveField}
        setSnackbar={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/first name/i);
    await userEvent.type(input, "john");
    expect(input).toHaveValue("John");
    await userEvent.tab();

    expect(saveField).toHaveBeenCalledWith("firstName", "John");
  });
});

describe("Dark mode styling", () => {
  it("applies dark classes in Row1", () => {
    render(
      <div className="dark">
        <Row1
          occupantDetails={{ firstName: "", lastName: "", gender: "" }}
          saveField={jest.fn()}
          setSnackbar={jest.fn()}
        />
      </div>
    );
    const input = screen.getByLabelText(/first name/i);
    expect(input).toHaveClass("dark:bg-darkSurface");
  });
});
