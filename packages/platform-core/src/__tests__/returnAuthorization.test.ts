/** @jest-environment node */

jest.mock("../repositories/returnAuthorization.server", () => ({
  addReturnAuthorization: jest.fn(),
  readReturnAuthorizations: jest.fn(),
}));

describe("returnAuthorization", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("builds RA IDs and delegates to addReturnAuthorization", async () => {
    const { createReturnAuthorization } = await import(
      "../returnAuthorization"
    );
    const repo = await import("../repositories/returnAuthorization.server");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(123456);
    const ra = await createReturnAuthorization({
      orderId: "o1",
      status: "received",
      inspectionNotes: "Looks good",
    });
    expect(ra.raId).toBe(`RA${(123456).toString(36).toUpperCase()}`);
    expect(ra.status).toBe("received");
    expect(ra.inspectionNotes).toBe("Looks good");
    expect(repo.addReturnAuthorization).toHaveBeenCalledWith(ra);
    nowSpy.mockRestore();
  });

  it("defaults to pending status and empty inspection notes", async () => {
    const { createReturnAuthorization } = await import(
      "../returnAuthorization"
    );
    const repo = await import("../repositories/returnAuthorization.server");
    const ra = await createReturnAuthorization({ orderId: "o1" });
    expect(ra.status).toBe("pending");
    expect(ra.inspectionNotes).toBe("");
    expect(repo.addReturnAuthorization).toHaveBeenCalledWith(ra);
  });

  it("delegates to readReturnAuthorizations", async () => {
    const { listReturnAuthorizations } = await import("../returnAuthorization");
    const repo = await import("../repositories/returnAuthorization.server");
    const list = [
      { raId: "RA1", orderId: "o1", status: "pending", inspectionNotes: "" },
    ];
    (repo.readReturnAuthorizations as jest.Mock).mockResolvedValue(list);
    const result = await listReturnAuthorizations();
    expect(repo.readReturnAuthorizations).toHaveBeenCalled();
    expect(result).toBe(list);
  });

  it("propagates errors from readReturnAuthorizations", async () => {
    const { listReturnAuthorizations } = await import("../returnAuthorization");
    const repo = await import("../repositories/returnAuthorization.server");
    const err = new Error("read failed");
    (repo.readReturnAuthorizations as jest.Mock).mockRejectedValue(err);
    await expect(listReturnAuthorizations()).rejects.toBe(err);
    expect(repo.readReturnAuthorizations).toHaveBeenCalled();
  });
});
