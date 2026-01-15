import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Mock components and hooks ----------------------------------
vi.mock("../DateSelectorAllo", () => ({
  __esModule: true,
  default: ({ selectedDate }: { selectedDate: string }) => (
    <div data-testid="date-selector">{selectedDate}</div>
  ),
}));

const sendMock = vi.fn();
const saveMock = vi.fn();

const useCheckinsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useCheckins", () => ({
  __esModule: true,
  useCheckins: useCheckinsMock,
}));

const useActivitiesByCodeDataMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  __esModule: true,
  default: useActivitiesByCodeDataMock,
}));

const useGuestDetailsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useGuestDetails", () => ({
  __esModule: true,
  default: useGuestDetailsMock,
}));

const useAlloggiatiLogsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useAlloggiatiLogs", () => ({
  __esModule: true,
  default: useAlloggiatiLogsMock,
}));

const useAlloggiatiSenderMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/mutations/useAlloggiatiSender", () => ({
  __esModule: true,
  useAlloggiatiSender: useAlloggiatiSenderMock,
}));

const useSaveAlloggiatiResultMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/mutations/useSaveAlloggiatiResult", () => ({
  __esModule: true,
  default: useSaveAlloggiatiResultMock,
}));

vi.mock("../../../utils/dateUtils", async () => {
  const actual = await vi.importActual<{ [key: string]: unknown }>("../../../utils/dateUtils");
  return {
    __esModule: true,
    ...actual,
    getItalyIsoString: () => "2024-05-02T09:00:00Z",
  };
});

// ---------------------------------------------------------------
import Alloggiati from "../Alloggiati";

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
    vi.clearAllMocks();
    useCheckinsMock.mockReturnValue({
      checkins: defaultCheckins,
      loading: false,
      error: null,
    });
    useActivitiesByCodeDataMock.mockReturnValue({
      activitiesByCodes: defaultActivities,
      loading: false,
      error: null,
    });
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: defaultGuestDetails,
      loading: false,
      error: null,
      validationError: null,
    });
    useAlloggiatiLogsMock.mockReturnValue({
      logs: defaultLogs,
      loading: false,
      error: null,
    });
    useAlloggiatiSenderMock.mockReturnValue({
      isLoading: false,
      error: null,
      sendAlloggiatiRecords: sendMock,
    });
    useSaveAlloggiatiResultMock.mockReturnValue({
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
    useCheckinsMock.mockReturnValue({
      checkins: {},
      loading: true,
      error: null,
    });
    render(<Alloggiati />);
    expect(
      screen.getByText(/Loading checkins, financial data, guest details, or occupant logs/)
    ).toBeInTheDocument();
  });

  it("shows error state", () => {
    useCheckinsMock.mockReturnValue({
      checkins: {},
      loading: false,
      error: "boom",
    });
    render(<Alloggiati />);
    expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
  });

  it("handles no occupants", () => {
    useCheckinsMock.mockReturnValue({
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
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: {},
      loading: false,
      error: null,
      validationError: null,
    });
    const alertMock = vi
      .spyOn(window, "alert")
      .mockImplementation(() => {
        return undefined;
      });
    render(<Alloggiati />);
    await userEvent.click(screen.getByRole("button", { name: /send occupants/i }));
    expect(sendMock).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("No occupant details available to send.");
    alertMock.mockRestore();
  });
});
