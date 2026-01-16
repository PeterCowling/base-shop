import { describe, it, expect, vi, afterEach } from "vitest";
import type { Database } from "firebase/database";

/* eslint-disable no-var */
var refMock: ReturnType<typeof vi.fn>;
var pushMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
var dateMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("firebase/database", () => {
  refMock = vi.fn(() => "auditRef");
  pushMock = vi.fn(() => "newRef");
  setMock = vi.fn(() => Promise.resolve());
  return { ref: refMock, push: pushMock, set: setMock };
});

vi.mock("../../utils/dateUtils", () => {
  dateMock = vi.fn(() => "2024-01-01T00:00:00Z");
  return { getItalyIsoString: dateMock };
});

import { logSettingChange } from "../logSettingChange";

describe("logSettingChange", () => {
  afterEach(() => vi.clearAllMocks());

  it("writes audit entry to firebase", async () => {
    await logSettingChange({} as Database, {
      user: "alice",
      setting: "cashDrawerLimit",
      oldValue: 1,
      newValue: 2,
    });

    expect(refMock).toHaveBeenCalledWith({}, "audit/settingChanges");
    expect(pushMock).toHaveBeenCalledWith("auditRef");
    expect(setMock).toHaveBeenCalledWith("newRef", {
      user: "alice",
      timestamp: "2024-01-01T00:00:00Z",
      setting: "cashDrawerLimit",
      oldValue: 1,
      newValue: 2,
    });
  });
});
