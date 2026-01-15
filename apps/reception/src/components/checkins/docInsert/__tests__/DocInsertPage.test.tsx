import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OccupantDetails } from "../../../../types/hooks/data/guestDetailsData";

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------

/* eslint-disable no-var */
var navigateMock: ReturnType<typeof vi.fn>;
var saveFieldMock: ReturnType<typeof vi.fn>;
var logActivityMock: ReturnType<typeof vi.fn>;
var occupantIsCompleteMock: ReturnType<typeof vi.fn>;
var showToastMock: ReturnType<typeof vi.fn>;
var baseOccupant: OccupantDetails;
/* eslint-enable no-var */

vi.mock("react-router-dom", async () => {
  navigateMock = vi.fn();
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      state: { bookingRef: "BR1", occupantId: "O1", selectedDate: "2025-01-01" },
    }),
  };
});

vi.mock("../../../../hooks/data/useSingleGuestDetails", () => {
  saveFieldMock = vi.fn().mockResolvedValue(undefined);
  baseOccupant = {
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

  return {
    __esModule: true,
    default: () => ({
      occupantDetails: baseOccupant,
      loading: false,
      error: null,
      saveField: saveFieldMock,
    }),
  };
});

vi.mock("../../../../hooks/mutations/useActivitiesMutations", () => {
  logActivityMock = vi.fn();
  return {
    __esModule: true,
    default: () => ({ logActivity: logActivityMock }),
  };
});

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

vi.mock("../row2", () => ({ __esModule: true, default: () => <div>row2</div> }));
vi.mock("../row3", () => ({ __esModule: true, default: () => <div>row3</div> }));
vi.mock("../BookingRef", () => ({
  __esModule: true,
  default: ({ bookingRef }: { bookingRef: string }) => (
    <div>booking-{bookingRef}</div>
  ),
}));

vi.mock("../occupantCompleteHelpers", () => {
  occupantIsCompleteMock = vi.fn();
  return {
    occupantIsComplete: occupantIsCompleteMock,
  };
});

// ------------------------------------------------------------------
// Component under test (imported after mocks)
// ------------------------------------------------------------------
import DocInsertPage from "../DocInsertPage";
import Row1 from "../row1";

// Mock DocInsertData for Row2 tests
vi.mock("../DocInsertData", () => ({
  countries: ["Italy", "France"],
  municipalities: ["Rome", "Milan"],
}));

vi.mock("../../../../utils/toastUtils", () => {
  showToastMock = vi.fn();
  return { showToast: showToastMock };
});

// ------------------------------------------------------------------
// Test suites
// ------------------------------------------------------------------

describe("DocInsertPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  it("capitalizes input and saves on blur", async () => {
    const saveField = vi.fn().mockResolvedValue(undefined);
    render(
      <Row1
        occupantDetails={{ firstName: "", lastName: "", gender: "" }}
        saveField={saveField}
        setSnackbar={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/first name/i);
    await userEvent.type(input, "john");
    expect(input).toHaveValue("John");
    await userEvent.tab();

    expect(saveField).toHaveBeenCalledWith("firstName", "John");
  });
});

describe("Row2 validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves valid citizenship on enter", async () => {
    const saveField = vi.fn().mockResolvedValue(undefined);
    const { default: Row2 } = await vi.importActual<typeof import("../row2")>(
      "../row2"
    );
    render(
      <Row2 occupantDetails={{} as OccupantDetails} saveField={saveField} />
    );
    const input = screen.getByLabelText(/citizenship/i);
    await userEvent.type(input, "Italy{enter}");
    expect(saveField).toHaveBeenCalledWith("citizenship", "Italy");
  });

  it("rejects invalid citizenship", async () => {
    const saveField = vi.fn().mockResolvedValue(undefined);
    const { default: Row2 } = await vi.importActual<typeof import("../row2")>(
      "../row2"
    );
    render(
      <Row2 occupantDetails={{} as OccupantDetails} saveField={saveField} />
    );
    const input = screen.getByLabelText(/citizenship/i);
    await userEvent.type(input, "Atlantis{enter}");
    expect(saveField).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "This is not a valid value.",
      "error"
    );
  });
});

describe("Row3 validation", () => {
  it("uppercases doc number and saves", async () => {
    const saveField = vi.fn().mockResolvedValue(undefined);
    const { default: Row3 } = await vi.importActual<typeof import("../row3")>(
      "../row3"
    );
    render(
      <Row3
        occupantDetails={{ document: {} } as OccupantDetails}
        saveField={saveField}
        setSnackbar={vi.fn()}
      />
    );
    const docNum = screen.getByLabelText(/document number/i);
    await userEvent.type(docNum, "ab123");
    expect(docNum).toHaveValue("AB123");
    await userEvent.tab();
    expect(saveField).toHaveBeenCalledWith("document/number", "AB123");
  });
});

describe("Dark mode styling", () => {
  it("applies dark classes in Row1", () => {
    render(
      <div className="dark">
        <Row1
          occupantDetails={{ firstName: "", lastName: "", gender: "" }}
          saveField={vi.fn()}
          setSnackbar={vi.fn()}
        />
      </div>
    );
    const input = screen.getByLabelText(/first name/i);
    expect(input).toHaveClass("dark:bg-darkSurface");
  });

  it("applies dark classes in Row2", async () => {
    const { default: Row2 } = await vi.importActual<typeof import("../row2")>(
      "../row2"
    );
    render(
      <div className="dark">
        <Row2 occupantDetails={{} as OccupantDetails} saveField={vi.fn()} />
      </div>
    );
    const input = screen.getByLabelText(/citizenship/i);
    expect(input).toHaveClass("dark:bg-darkSurface");
  });
});

