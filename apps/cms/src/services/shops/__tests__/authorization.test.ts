import { authorize } from "../authorization";

jest.mock("../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

describe("authorization service", () => {
  it("delegates to ensureAuthorized", async () => {
    const { ensureAuthorized } = await import(
      "../../../actions/common/auth"
    );
    await authorize();
    expect(ensureAuthorized).toHaveBeenCalled();
  });
});
