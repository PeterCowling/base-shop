import "@testing-library/jest-dom";
import type { Database } from "firebase/database";

/* eslint-disable no-var */
var refMock: jest.Mock;
var pushMock: jest.Mock;
var setMock: jest.Mock;
var dateMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn(() => "auditRef");
  pushMock = jest.fn(() => "newRef");
  setMock = jest.fn(() => Promise.resolve());
  return { ref: refMock, push: pushMock, set: setMock };
});

jest.mock("../../utils/dateUtils", () => {
  dateMock = jest.fn(() => "2024-01-01T00:00:00Z");
  return { getItalyIsoString: dateMock };
});

import { logSettingChange } from "../logSettingChange";

describe("logSettingChange", () => {
  afterEach(() => jest.clearAllMocks());

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
