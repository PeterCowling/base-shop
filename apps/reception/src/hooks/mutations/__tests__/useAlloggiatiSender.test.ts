import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";
import { useAlloggiatiSender } from "../useAlloggiatiSender";

// Mock constructAlloggiatiRecord hook
const constructMock = jest.fn();
jest.mock("../../utils/useConstructAlloggiatiRecord", () => ({
  useConstructAlloggiatiRecord: () => ({
    constructAlloggiatiRecord: constructMock,
  }),
}));

function mockJsonpSuccess(response: unknown) {
  const originalAppend = document.body.appendChild.bind(document.body);

  jest.spyOn(document.body, "appendChild").mockImplementation((el: Node) => {
    if (el instanceof HTMLScriptElement) {
      const url = new URL(el.src);
      const cb = url.searchParams.get("callback");
      if (cb) {
         
        (window as any)[cb](response);
      }
      return el;
    }
    return originalAppend(el);
  });
}

function mockJsonpError() {
  const originalAppend = document.body.appendChild.bind(document.body);

  jest.spyOn(document.body, "appendChild").mockImplementation((el: Node) => {
    if (el instanceof HTMLScriptElement) {
      el.onerror?.(new Event("error"));
      return el;
    }
    return originalAppend(el);
  });
}

describe("useAlloggiatiSender", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    constructMock.mockReset();
  });

  it("calls constructAlloggiatiRecord for each occupant and returns results", async () => {
    const response = {
      resultDetails: [
        { recordNumber: "1", status: "ok" },
        {
          recordNumber: "2",
          status: "error",
          erroreCod: "11",
          erroreDes: "BAD",
          erroreDettaglio: "detail",
          occupantRecord: "rec",
          occupantRecordLength: 3,
        },
      ],
    };
    mockJsonpSuccess(response);
    constructMock.mockReturnValue("REC");

    const { result } = renderHook(() => useAlloggiatiSender());

    const occupants: Array<Partial<OccupantDetails> & { id: number }> = [
      { id: 1 },
      { id: 2 },
    ];
    let records;
    await act(async () => {
      records = await result.current.sendAlloggiatiRecords(occupants, false);
    });

    expect(constructMock).toHaveBeenCalledTimes(2);
    expect(constructMock).toHaveBeenNthCalledWith(1, occupants[0]);
    expect(constructMock).toHaveBeenNthCalledWith(2, occupants[1]);
    expect(records).toEqual([
      { recordNumber: "1", status: "ok" },
      {
        recordNumber: "2",
        status: "error",
        erroreCod: "11",
        erroreDes: "BAD",
        erroreDettaglio: "detail",
        occupantRecord: "rec",
        occupantRecordLength: 3,
      },
    ]);
  });

  it("sets error when JSONP script fails", async () => {
    mockJsonpError();
    constructMock.mockReturnValue("REC");

    const { result } = renderHook(() => useAlloggiatiSender());
    const occupants: Array<Partial<OccupantDetails> & { id: number }> = [
      { id: 1 },
    ];
    let records;
    await act(async () => {
      records = await result.current.sendAlloggiatiRecords(occupants, false);
    });

    expect(records).toBeNull();
    expect(result.current.error).toBe("Network error loading JSONP script.");
  });
});
