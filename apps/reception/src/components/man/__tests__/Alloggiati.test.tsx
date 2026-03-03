import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------
import Alloggiati from "../Alloggiati";

// --- Mock components and hooks ----------------------------------
jest.mock("../DateSelectorAllo", () => ({
  __esModule: true,
  default: ({ selectedDate }: { selectedDate: string }) => (
    <div data-testid="date-selector">{selectedDate}</div>
  ),
}));

const sendMock = jest.fn();
const saveMock = jest.fn();
const showToastMock = jest.fn();

const checkinsHookMock = jest.fn();
jest.mock("../../../hooks/data/useCheckins", () => ({
  __esModule: true,
  useCheckins: (...args: unknown[]) => checkinsHookMock(...args),
}));

const activitiesByCodeDataHookMock = jest.fn();
jest.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => activitiesByCodeDataHookMock(...args),
}));

const guestDetailsHookMock = jest.fn();
jest.mock("../../../hooks/data/useGuestDetails", () => ({
  __esModule: true,
  default: (...args: unknown[]) => guestDetailsHookMock(...args),
}));

const alloggiatiLogsHookMock = jest.fn();
jest.mock("../../../hooks/data/useAlloggiatiLogs", () => ({
  __esModule: true,
  default: (...args: unknown[]) => alloggiatiLogsHookMock(...args),
}));

const alloggiatiSenderHookMock = jest.fn();
jest.mock("../../../hooks/mutations/useAlloggiatiSender", () => ({
  __esModule: true,
  useAlloggiatiSender: (...args: unknown[]) => alloggiatiSenderHookMock(...args),
}));

const saveAlloggiatiResultHookMock = jest.fn();
jest.mock("../../../hooks/mutations/useSaveAlloggiatiResult", () => ({
  __esModule: true,
  default: (...args: unknown[]) => saveAlloggiatiResultHookMock(...args),
}));

jest.mock("../../../utils/toastUtils", () => ({
  __esModule: true,
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

jest.mock("../../../utils/dateUtils", () => {
  const actual = jest.requireActual("../../../utils/dateUtils");
  return {
    __esModule: true,
    ...actual,
    getItalyIsoString: () => "2024-05-02T09:00:00Z",
  };
});

describe("Alloggiati", () => {
  const defaultCheckins = {
    "2024-05-01": {
      o1: { reservationCode: "r1", timestamp: "2024-05-01T12:00:00Z" },
      o2: { reservationCode: "r2", timestamp: "2024-05-01T14:00:00Z" },
    },
  };
  const defaultActivities = { "12": {} };
  const defaultGuestDetails = {
    r1: { o1: { firstName: "Alice", lastName: "Smith" } },
    r2: { o2: { firstName: "Bob", lastName: "Jones" } },
  };
  const defaultLogs = {
    o2: { result: "ok", timestamp: "2024-05-01T10:00:00Z" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    checkinsHookMock.mockReturnValue({
      checkins: defaultCheckins,
      loading: false,
      error: null,
    });
    activitiesByCodeDataHookMock.mockReturnValue({
      activitiesByCodes: defaultActivities,
      loading: false,
      error: null,
    });
    guestDetailsHookMock.mockReturnValue({
      guestsDetails: defaultGuestDetails,
      loading: false,
      error: null,
      validationError: null,
    });
    alloggiatiLogsHookMock.mockReturnValue({
      logs: defaultLogs,
      loading: false,
      error: null,
    });
    alloggiatiSenderHookMock.mockReturnValue({
      isLoading: false,
      error: null,
      sendAlloggiatiRecords: sendMock,
    });
    saveAlloggiatiResultHookMock.mockReturnValue({
      saveAlloggiatiResult: saveMock,
      error: null,
    });
  });

  it("renders occupant table", () => {
    render(<Alloggiati />);
    expect(screen.getByText("o1")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("o2")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toBeChecked();
  });
  it("toggles selection and submits occupants", async () => {
    sendMock.mockResolvedValue([{ recordNumber: "1", status: "ok" }]);
    render(<Alloggiati />);

    const toggle = screen.getByRole("button", { name: /select \/ deselect all/i });
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(toggle);
    expect(checkbox).not.toBeChecked();
    await userEvent.click(toggle);
    expect(checkbox).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /send occupants/i }));
    expect(sendMock).toHaveBeenCalledWith([
      { firstName: "Alice", lastName: "Smith" }],
      false
    );
    expect(saveMock).toHaveBeenCalledWith(
      "2024-05-01",
      "o1",
      "ok",
      "2024-05-02T09:00:00Z"
    );
    expect(screen.getByText(/submission results/i)).toBeInTheDocument();
  });

  it("handles error results", async () => {
    sendMock.mockResolvedValue([
      {
        status: "error",
        erroreCod: "E1",
        erroreDes: "Bad",
        erroreDettaglio: "detail",
        occupantRecord: "rec",
        occupantRecordLength: 1,
      },
    ]);
    render(<Alloggiati />);
    await userEvent.click(screen.getByRole("button", { name: /send occupants/i }));
    expect(saveMock).toHaveBeenCalledWith(
      "2024-05-01",
      "o1",
      "error",
      "2024-05-02T09:00:00Z",
      expect.objectContaining({ erroreCod: "E1" })
    );
  });

  it("shows loading state", () => {
    checkinsHookMock.mockReturnValue({
      checkins: {},
      loading: true,
      error: null,
    });
    render(<Alloggiati />);
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("shows error state", () => {
    checkinsHookMock.mockReturnValue({
      checkins: {},
      loading: false,
      error: "boom",
    });
    render(<Alloggiati />);
    expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
  });

  it("handles no occupants", () => {
    checkinsHookMock.mockReturnValue({
      checkins: {},
      loading: false,
      error: null,
    });
    render(<Alloggiati />);
    expect(
      screen.getByText(/No occupants found/)
    ).toBeInTheDocument();
  });

  it("alerts when no occupant details", async () => {
    guestDetailsHookMock.mockReturnValue({
      guestsDetails: {},
      loading: false,
      error: null,
      validationError: null,
    });
    render(<Alloggiati />);
    await userEvent.click(screen.getByRole("button", { name: /send occupants/i }));
    expect(sendMock).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "No occupant details available to send.",
      "warning"
    );
  });
});
