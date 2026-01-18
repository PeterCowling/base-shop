const ensureAuthorized = jest.fn();
const readJsonFile = jest.fn();
const writeJsonFile = jest.fn();
const withFileLock = jest.fn();
const argon2Hash = jest.fn();

jest.mock("@cms/actions/common/auth", () => ({ ensureAuthorized }));
jest.mock("@/lib/server/jsonIO", () => ({
  readJsonFile: (...args: unknown[]) => readJsonFile(...args),
  writeJsonFile: (...args: unknown[]) => writeJsonFile(...args),
  withFileLock: (...args: unknown[]) => withFileLock(...args),
}));
jest.mock("argon2", () => ({ hash: (...args: unknown[]) => argon2Hash(...args) }));

let POST: typeof import("../route").POST;

describe("preview-link creation auth", () => {
  beforeAll(async () => {
    ({ POST } = await import("../route"));
  });

  beforeEach(() => {
    ensureAuthorized.mockReset();
    readJsonFile.mockReset();
    writeJsonFile.mockReset();
    withFileLock.mockReset();
    argon2Hash.mockReset();
  });

  it("returns 403 when unauthorized", async () => {
    ensureAuthorized.mockRejectedValue(new Error("Forbidden"));

    const res = await POST(
      new Request("http://test.local/api/page-versions/preview-link", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ shop: "demo", pageId: "p1", versionId: "v1" }) } as any
    );

    expect(res.status).toBe(403);
    expect(writeJsonFile).not.toHaveBeenCalled();
  });

  it("creates a preview link when authorized", async () => {
    ensureAuthorized.mockResolvedValue({ user: { role: "admin" } });
    readJsonFile.mockResolvedValue({});
    withFileLock.mockImplementation(async (_path: string, fn: () => Promise<void>) => {
      await fn();
    });
    argon2Hash.mockResolvedValue("$argon2id$hashed");

    const res = await POST(
      new Request("http://test.local/api/page-versions/preview-link", {
        method: "POST",
        body: JSON.stringify({ password: "secret" }),
      }),
      { params: Promise.resolve({ shop: "demo", pageId: "p1", versionId: "v1" }) } as any
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.shop).toBe("demo");
    expect(body.pageId).toBe("p1");
    expect(body.versionId).toBe("v1");
    expect(body.token).toBeDefined();
    expect(writeJsonFile).toHaveBeenCalledTimes(1);
    const [, store] = writeJsonFile.mock.calls[0];
    expect(store[body.token]).toMatchObject({
      shop: "demo",
      pageId: "p1",
      versionId: "v1",
      passwordHash: "$argon2id$hashed",
    });
  });
});
