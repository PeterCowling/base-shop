import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useCCIrregularitiesMutations } from "../useCCIrregularitiesMutations";

/* eslint-disable no-var */
var database: unknown;
var user: { user_name: string } | null;
var pushMock: jest.Mock;
var setMock: jest.Mock;
var refMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  pushMock = jest.fn(() => "newRef");
  refMock = jest.fn(() => "ccIrregularities");
  setMock = jest.fn();
});

describe("useCCIrregularitiesMutations", () => {
  it("writes irregularity record", async () => {
    const { result } = renderHook(() => useCCIrregularitiesMutations());

    await act(async () => {
      await result.current.addCCIrregularity("close", 2);
    });

    expect(refMock).toHaveBeenCalledWith(database, "ccIrregularities");
    expect(pushMock).toHaveBeenCalledWith("ccIrregularities");
    expect(setMock).toHaveBeenCalledWith("newRef", {
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
      action: "close",
      missingCount: 2,
    });
  });

  it("does nothing when user missing", async () => {
    user = null;
    const { result } = renderHook(() => useCCIrregularitiesMutations());

    await act(async () => {
      await result.current.addCCIrregularity("close", 1);
    });

    expect(setMock).not.toHaveBeenCalled();
  });
});
