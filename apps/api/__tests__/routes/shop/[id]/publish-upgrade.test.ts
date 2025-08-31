import request from "supertest";
import { createRequestHandler } from "../../../test-utils";

describe("publish-upgrade route", () => {
  beforeAll(() => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
  });

  it("rejects invalid shop id", async () => {
    const res = await request(createRequestHandler()).post(
      "/shop/ABC/publish-upgrade",
    );
    expect(res.status).toBe(400);
  });

  it("requires bearer token", async () => {
    const res = await request(createRequestHandler()).post(
      "/shop/abc/publish-upgrade",
    );
    expect(res.status).toBe(401);
  });
});
