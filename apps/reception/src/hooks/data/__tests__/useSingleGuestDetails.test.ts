import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mutable references used by the mocked useFirebaseSubscription implementation.
// They store the data that will be returned to the hook under test.
let occupantData: Record<string, unknown> | null = null;
let allocatedRoomData: string | null = null;
let detailsError: unknown = null;
let allocError: unknown = null;

vi.mock("../useFirebaseSubscription", () => ({
  __esModule: true,
  default: (path: string) => {
    if (path.startsWith("guestsDetails")) {
      return { data: occupantData, loading: false, error: detailsError };
    }
    if (path.startsWith("guestByRoom")) {
      return { data: allocatedRoomData, loading: false, error: allocError };
    }
    return { data: null, loading: false, error: null };
  },
}));

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  update: vi.fn(),
}));

import useSingleGuestDetails from "../useSingleGuestDetails";

describe("useSingleGuestDetails", () => {
  afterEach(() => {
    vi.clearAllMocks();
    occupantData = null;
    allocatedRoomData = null;
    detailsError = null;
    allocError = null;
  });

  it("parses occupant data and merges allocated room", () => {
    occupantData = {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: { yyyy: "1990", mm: "05", dd: "15" },
    };
    allocatedRoomData = "5";

    const { result } = renderHook(() => useSingleGuestDetails("BR1", "occ1"));

    expect(result.current.occupantDetails).toEqual({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: { yyyy: "1990", mm: "05", dd: "15" },
      allocated: "5",
    });
    expect(result.current.error).toBeNull();
  });

  it("reports validation error when occupant data invalid", () => {
    occupantData = { dateOfBirth: { yyyy: "1990", mm: "13", dd: "15" } };
    allocatedRoomData = "5";

    const { result } = renderHook(() => useSingleGuestDetails("BR1", "occ1"));

    expect(result.current.occupantDetails).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
