const readJsonFile = jest.fn();
const argon2Verify = jest.fn();

jest.mock("@/lib/server/jsonIO", () => ({
  readJsonFile: (...args: unknown[]) => readJsonFile(...args),
}));

jest.mock("argon2", () => ({
  verify: (...args: unknown[]) => argon2Verify(...args),
}));

let GET: typeof import("../route").GET;

describe("preview token auth", () => {
  beforeAll(async () => {
    ({ GET } = await import("../route"));
  });

  beforeEach(() => {
    readJsonFile.mockReset();
    argon2Verify.mockReset();
  });

  it("accepts argon2 hashes", async () => {
    readJsonFile.mockResolvedValueOnce({
      t1: {
        token: "t1",
        shop: "demo",
        pageId: "p1",
        versionId: "v1",
        createdAt: new Date().toISOString(),
        passwordHash: "$argon2id$hashed",
      },
    });
    readJsonFile.mockResolvedValueOnce({
      demo: { p1: [{ id: "v1", label: "v1", timestamp: "now", components: [] }] },
    });
    argon2Verify.mockResolvedValue(true);

    const res = await GET(
      new Request("http://test.local/api/page-versions/preview/t1?pw=secret"),
      { params: Promise.resolve({ token: "t1" }) } as any
    );

    expect(res.status).toBe(200);
    expect(argon2Verify).toHaveBeenCalledWith("$argon2id$hashed", "secret");
  });

  it("accepts legacy sha256 hashes", async () => {
    const crypto = await import("crypto");
    const legacyHash = crypto.createHash("sha256").update("secret").digest("hex");

    readJsonFile.mockResolvedValueOnce({
      t2: {
        token: "t2",
        shop: "demo",
        pageId: "p1",
        versionId: "v1",
        createdAt: new Date().toISOString(),
        passwordHash: legacyHash,
      },
    });
    readJsonFile.mockResolvedValueOnce({
      demo: { p1: [{ id: "v1", label: "v1", timestamp: "now", components: [] }] },
    });

    const res = await GET(
      new Request("http://test.local/api/page-versions/preview/t2?pw=secret"),
      { params: Promise.resolve({ token: "t2" }) } as any
    );

    expect(res.status).toBe(200);
  });

  it("rejects invalid password", async () => {
    readJsonFile.mockResolvedValueOnce({
      t3: {
        token: "t3",
        shop: "demo",
        pageId: "p1",
        versionId: "v1",
        createdAt: new Date().toISOString(),
        passwordHash: "$argon2id$hashed",
      },
    });
    argon2Verify.mockResolvedValue(false);

    const res = await GET(
      new Request("http://test.local/api/page-versions/preview/t3?pw=bad"),
      { params: Promise.resolve({ token: "t3" }) } as any
    );

    expect(res.status).toBe(401);
  });
});
