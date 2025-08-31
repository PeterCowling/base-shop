import request from "supertest";
import { createTestServer } from "../../../testServer";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("publish-upgrade route", () => {
  let server: any;

  beforeAll(async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
    server = await createTestServer();
  });

  afterAll(() => server.close());

  it("rejects missing token", async () => {
    const res = await request(server).post("/shop/bcd/publish-upgrade");
    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await request(server)
      .post("/shop/bcd/publish-upgrade")
      .set("Authorization", "Bearer bad");
    expect(res.status).toBe(403);
  });
});
