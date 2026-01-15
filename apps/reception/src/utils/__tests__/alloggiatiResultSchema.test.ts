import { describe, expect, it } from "vitest";

import { alloggiatiResultDetailSchema } from "../alloggiatiResultSchema";

describe("alloggiatiResultDetailSchema", () => {
  it("rejects when status is not ok and esito is not false", () => {
    const result = alloggiatiResultDetailSchema.safeParse({
      recordNumber: "1",
      status: "error",
      esito: true,
      erroreCod: "E1",
      erroreDes: "desc",
      erroreDettaglio: "det",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["esito"],
          message: "esito must be false when status is not ok",
        }),
      ]),
    );
  });

  it("requires erroreDes when status is not ok", () => {
    const result = alloggiatiResultDetailSchema.safeParse({
      recordNumber: "1",
      status: "error",
      esito: false,
      erroreCod: "E1",
      erroreDettaglio: "det",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["erroreDes"],
          message: "erroreDes required",
        }),
      ]),
    );
  });

  it("requires erroreCod and erroreDettaglio when status is not ok", () => {
    const result = alloggiatiResultDetailSchema.safeParse({
      recordNumber: "1",
      status: "error",
      esito: false,
      erroreDes: "desc",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["erroreCod"],
          message: "erroreCod required",
        }),
        expect.objectContaining({
          path: ["erroreDettaglio"],
          message: "erroreDettaglio required",
        }),
      ]),
    );
  });

  it("passes when status is ok", () => {
    const result = alloggiatiResultDetailSchema.safeParse({
      recordNumber: "1",
      status: "ok",
    });

    expect(result.success).toBe(true);
  });
});

