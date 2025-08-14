import { jest } from "@jest/globals";

jest.mock("@acme/date-utils", () => ({
  __esModule: true,
  ...jest.requireActual("@acme/date-utils"),
  nowIso: jest.fn(),
}));

import { nowIso } from "@acme/date-utils";

describe("nowIso", () => {
  it("can be mocked for deterministic output", () => {
    (nowIso as jest.Mock).mockReturnValue("2020-01-01T00:00:00.000Z");
    expect(nowIso()).toBe("2020-01-01T00:00:00.000Z");
  });
});
