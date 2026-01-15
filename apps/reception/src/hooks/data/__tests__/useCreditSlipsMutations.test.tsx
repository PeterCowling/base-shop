import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreditSlipsMutations } from "../till/useCreditSlipsMutations";

/* eslint-disable no-var */
var database: unknown;
var user: { user_name: string } | null;
var pushMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

vi.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  pushMock = vi.fn(() => "newRef");
  refMock = vi.fn(() => "creditSlips");
  setMock = vi.fn();
});

describe("useCreditSlipsMutations", () => {
  it("writes expanded credit slip record", async () => {
    const { result } = renderHook(() => useCreditSlipsMutations());

    await result.current.addCreditSlip({
      slipNumber: "S1",
      amount: 5,
    });

    expect(setMock).toHaveBeenCalledWith("newRef", {
      slipNumber: "S1",
      amount: 5,
      timestamp: "2024-01-01T10:00:00Z",
      user: "tester",
    });
  });

  it("returns early when user null", async () => {
    user = null;
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useCreditSlipsMutations());

    await result.current.addCreditSlip({ slipNumber: "S2", amount: 2 });

    expect(setMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "No user logged in; cannot add credit slip."
    );
    errorSpy.mockRestore();
  });
});
