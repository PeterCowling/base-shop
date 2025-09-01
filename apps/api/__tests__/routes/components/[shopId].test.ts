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

  it("returns 400 for invalid shop id", async () => {
    const res = await request(createRequestHandler()).get(
      "/components/INVALID_ID"
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid shop id" });
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
