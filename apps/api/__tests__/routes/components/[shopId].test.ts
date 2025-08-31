import request from "supertest";
import jwt from "jsonwebtoken";
import { createTestServer } from "../../testServer";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("components route", () => {
  let server: any;

  beforeAll(async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
    server = await createTestServer();
  });

  afterAll(() => server.close());

  it("returns components for valid token", async () => {
    const token = jwt.sign({ sub: "1" }, process.env.UPGRADE_PREVIEW_TOKEN_SECRET!);
    const res = await request(server)
      .get("/components/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ components: [] });
  });

  it("rejects requests without token", async () => {
    const res = await request(server).get("/components/abc");
    expect(res.status).toBe(403);
  });
});
