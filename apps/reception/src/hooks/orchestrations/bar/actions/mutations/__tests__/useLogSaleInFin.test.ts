import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useLogSaleInFin } from "../useLogSaleInFin";

// Mocks are declared with `var` so they can be assigned within the
// hoisted `vi.mock` factory below.

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var pushMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  pushMock = jest.fn();

  return {
    ref: refMock,
    push: pushMock,
  };
});

jest.mock("../../../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

beforeEach(() => {
  database = {};
  refMock.mockClear();
  pushMock.mockClear();
});

describe("useLogSaleInFin", () => {
  it("writes log record with timestamp", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-01T10:00:00Z"));

    const { result } = renderHook(() => useLogSaleInFin({}));
    await act(async () => {
      await result.current.logSaleInFin("Beer", 3, "user", "sale", "1");
    });

    expect(pushMock).toHaveBeenCalledWith({ path: "bar/finManLogs" }, {
      salesDetails: "Beer",
      salesPrice: 3,
      userName: "user",
      transType: "sale",
      bleep: "1",
      timestamp: new Date("2024-06-01T10:00:00Z").toISOString(),
    });
    jest.useRealTimers();
    expect(result.current.error).toBeNull();
  });
});
