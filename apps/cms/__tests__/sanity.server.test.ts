/** @jest-environment node */
import { FormData } from "undici";

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("sanity server actions", () => {
  afterEach(() => jest.resetModules());

  it("connects with valid credentials", async () => {
    mockAuth();
    const { connectSanity } = await import("../src/actions/sanity.server");
    const form = new FormData();
    form.set("projectId", "p1");
    form.set("dataset", "d1");
    form.set("token", "t1");
    await expect(connectSanity(form)).resolves.toEqual({ ok: true });
  });

  it("returns error when credentials missing", async () => {
    mockAuth();
    const { connectSanity } = await import("../src/actions/sanity.server");
    const form = new FormData();
    await expect(connectSanity(form)).resolves.toEqual({ ok: false, error: "Missing credentials" });
  });
});
