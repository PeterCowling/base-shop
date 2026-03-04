import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Statistics from "../Statistics";

const mockFetch = jest.fn();
const mockGetFirebaseAuth = jest.fn();
const mockUseFirebaseApp = jest.fn();

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseApp: () => mockUseFirebaseApp(),
}));

jest.mock("../../../services/firebaseAuth", () => ({
  getFirebaseAuth: (...args: unknown[]) => mockGetFirebaseAuth(...args),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;

  mockUseFirebaseApp.mockReturnValue({ projectId: "test" });
  mockGetFirebaseAuth.mockReturnValue({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue("test-token"),
    },
  });

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      mode: "room-plus-bar",
      year: 2026,
      previousYear: 2025,
      monthly: [{ month: "01", currentValue: 100, previousValue: 80, delta: 20, deltaPct: 25 }],
      summary: { currentYtd: 100, previousYtd: 80, ytdDelta: 20, ytdDeltaPct: 25 },
      source: { current: "allFinancialTransactions", previous: "archive-db:allFinancialTransactions" },
    }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("Statistics", () => {
  it("renders YoY summary from API", async () => {
    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText(/year-on-year performance/i)).toBeInTheDocument();
      expect(screen.getByText(/ytd delta/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/statistics/yoy"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("switches mode and triggers reload", async () => {
    const user = userEvent.setup();
    render(<Statistics />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: /room only/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch.mock.calls[1]?.[0]).toContain("mode=room-only");
  });

  it("shows error when API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Failed" }),
    });

    render(<Statistics />);

    await screen.findByText("Failed");
  });
});
