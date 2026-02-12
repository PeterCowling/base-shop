import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ActivitiesClient from "../ActivitiesClient";

const mockSet = jest.fn(async () => undefined);
const mockOnValue = jest.fn();
const mockOff = jest.fn();
const mockDb = { __db: true };

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      const copy: Record<string, string> = {
        "status.live": "Live now",
        "status.ended": "Event ended",
        "status.upcoming": "Upcoming",
        "presence.markPresent": "I'm here",
        "presence.markedPresent": "Already here",
        "presence.availableOnceLive": "Available once live",
        "actions.joinNow": "Join now",
        "actions.eventEnded": "Event ended",
        "actions.seeDetails": "See details",
        "time.startingNow": "Starting now",
        "time.eventFinished": "Event finished",
      };
      if (key === "time.inDays") {
        const count = (options as { count?: number } | undefined)?.count ?? 0;
        return `in ${count} days`;
      }
      if (key === "time.inHoursMinutes") {
        const values = (options as { hours?: number; minutes?: number } | undefined) ?? {};
        return `in ${values.hours ?? 0}h ${values.minutes ?? 0}m`;
      }
      if (key === "time.inMinutes") {
        const values = (options as { minutes?: number } | undefined) ?? {};
        return `in ${values.minutes ?? 0} minutes`;
      }
      return copy[key] ?? key;
    },
  }),
}));

jest.mock("../../../../contexts/messaging/ChatProvider", () => ({
  useChat: () => ({
    activities: {
      live1: {
        id: "live1",
        templateId: "tmpl1",
        title: "Sunset Walk",
        startTime: Date.now() - 10 * 60 * 1000,
        status: "live",
        createdBy: "staff",
      },
      upcoming1: {
        id: "upcoming1",
        templateId: "tmpl2",
        title: "Boat Tour",
        startTime: Date.now() + 3 * 60 * 60 * 1000,
        status: "upcoming",
        createdBy: "staff",
      },
      ended1: {
        id: "ended1",
        templateId: "tmpl3",
        title: "Morning Hike",
        startTime: Date.now() - 6 * 60 * 60 * 1000,
        status: "archived",
        createdBy: "staff",
      },
    },
    hasMoreActivities: false,
    loadMoreActivities: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/useUuid", () => ({
  __esModule: true,
  default: () => "occ_1234567890123",
}));

jest.mock("../../../../lib/auth/guestSessionGuard", () => ({
  readGuestSession: () => ({
    token: "token-1",
    bookingId: "BOOK123",
    uuid: "occ_1234567890123",
    firstName: "Jane",
    verifiedAt: "2026-02-07T00:00:00.000Z",
  }),
}));

jest.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDb,
}));

jest.mock("../../../../services/firebase", () => ({
  ref: (_db: unknown, path: string) => path,
  onValue: (...args: unknown[]) => mockOnValue(...args),
  off: (...args: unknown[]) => mockOff(...args),
  set: (...args: unknown[]) => mockSet(...args),
}));

describe("ActivitiesClient attendance lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnValue.mockImplementation((_path: string, callback: (snapshot: unknown) => void) => {
      callback({
        exists: () => true,
        val: () => ({
          live1: { occ_1234567890123: { at: Date.now() } },
        }),
      });
      return jest.fn();
    });
  });

  it("TC-01/TC-02/TC-03: renders lifecycle states and gates attendance", async () => {
    render(<ActivitiesClient />);

    expect(screen.getByText("Sunset Walk")).toBeDefined();
    expect(screen.getByText("Boat Tour")).toBeDefined();
    expect(screen.getByText("Morning Hike")).toBeDefined();

    expect(screen.getAllByText("Available once live").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Event ended").length).toBeGreaterThan(0);
  });

  it("TC-04: presence count renders from shared activity data", async () => {
    render(<ActivitiesClient />);
    await waitFor(() => {
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    });
  });

  it("TC-05: live activity allows marking presence", async () => {
    mockOnValue.mockImplementationOnce((_path: string, callback: (snapshot: unknown) => void) => {
      callback({
        exists: () => false,
        val: () => ({}),
      });
      return jest.fn();
    });

    render(<ActivitiesClient />);
    const markButtons = screen.getAllByRole("button", { name: "I'm here" });
    fireEvent.click(markButtons[0]);

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalled();
    });
  });
});
