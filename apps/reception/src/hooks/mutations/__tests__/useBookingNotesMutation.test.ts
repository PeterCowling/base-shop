import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useBookingNotesMutation from "../useBookingNotesMutation";

/* eslint-disable no-var */
var database: unknown;
var user: { user_name: string } | null;
var refMock: jest.Mock;
var setMock: jest.Mock;
var updateMock: jest.Mock;
var removeMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

jest.mock("firebase/database", () => ({
  getDatabase: () => database,
  ref: (...args: unknown[]) => refMock(...args),
  set: (...args: unknown[]) => setMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  remove: (...args: unknown[]) => removeMock(...args),
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  refMock = jest.fn((_, path: string) => path);
  setMock = jest.fn();
  updateMock = jest.fn();
  removeMock = jest.fn();
});

describe("useBookingNotesMutation", () => {
  it("adds note with timestamp and user", async () => {
    const { result } = renderHook(() => useBookingNotesMutation());

    await act(async () => {
      await result.current.addNote("BR1", " hello ");
    });

    expect(refMock).toHaveBeenCalledWith(database, "bookings/BR1/__notes/note_20240101T100000Z");
    expect(setMock).toHaveBeenCalledWith(
      "bookings/BR1/__notes/note_20240101T100000Z",
      {
        text: "hello",
        timestamp: "2024-01-01T10:00:00Z",
        user: "tester",
      }
    );
  });

  it("propagates addNote errors", async () => {
    setMock.mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useBookingNotesMutation());

    await expect(result.current.addNote("BR1", "x")).rejects.toThrow("fail");
  });

  it("updates note text", async () => {
    const { result } = renderHook(() => useBookingNotesMutation());

    await act(async () => {
      await result.current.updateNote("BR1", "id1", " new ");
    });

    expect(updateMock).toHaveBeenCalledWith(
      "bookings/BR1/__notes/id1",
      { text: "new" }
    );
  });

  it("deletes note and handles errors", async () => {
    removeMock.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useBookingNotesMutation());

    await expect(result.current.deleteNote("BR1", "id1")).rejects.toThrow("boom");
    expect(refMock).toHaveBeenCalledWith(database, "bookings/BR1/__notes/id1");
  });
});

