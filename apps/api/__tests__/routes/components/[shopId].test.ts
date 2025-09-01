import request from "supertest";
import jwt from "jsonwebtoken";
import { createRequestHandler } from "../../test-utils";

describe("components route", () => {
  beforeAll(() => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
  });

  it("rejects requests without token", async () => {
    const res = await request(createRequestHandler()).get("/components/abc");
    expect(res.status).toBe(403);
  });

  it("rejects requests with invalid token", async () => {
    const token = jwt.sign({}, "wrongsecret");
    const res = await request(createRequestHandler())
      .get("/components/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("returns components for valid token", async () => {
    const token = jwt.sign({}, "testsecret");
    const res = await request(createRequestHandler())
      .get("/components/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ components: [] });
  });
});
