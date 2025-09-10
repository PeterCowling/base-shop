/** @jest-environment node */

jest.mock("../src/repositories/returnAuthorization.server", () => ({
  addReturnAuthorization: jest.fn(),
  readReturnAuthorizations: jest.fn(),
}));

describe("returnAuthorization", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("forwards repository results unchanged", async () => {
    const { listReturnAuthorizations } = await import("../src/returnAuthorization");
    const repo = await import("../src/repositories/returnAuthorization.server");
    const list = [
      { raId: "RA1", orderId: "o1", status: "pending", inspectionNotes: "" },
    ];
    (repo.readReturnAuthorizations as jest.Mock).mockResolvedValue(list);
    const result = await listReturnAuthorizations();
    expect(repo.readReturnAuthorizations).toHaveBeenCalled();
    expect(result).toBe(list);
  });

  it("generates an RA-prefixed ID and persists via addReturnAuthorization", async () => {
    const { createReturnAuthorization } = await import("../src/returnAuthorization");
    const repo = await import("../src/repositories/returnAuthorization.server");
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
});
