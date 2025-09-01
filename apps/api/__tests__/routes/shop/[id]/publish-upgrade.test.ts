import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.mock("child_process", () => ({ spawn: jest.fn() }));

import { readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import { server, rest } from "../../../../../../test/msw/server";

let createRequestHandler: typeof import("../../../test-utils").createRequestHandler;

describe("publish-upgrade route", () => {
  beforeAll(async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
    ({ createRequestHandler } = await import("../../../test-utils"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(rest.all(/.*/, (req) => req.passthrough()));
    (readFileSync as jest.Mock).mockImplementation((p: any) => {
      if (String(p).endsWith("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (String(p).endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "{}";
    });
    (writeFileSync as jest.Mock).mockImplementation(() => {});
    (spawn as jest.Mock).mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown) => ({
        on: (_evt: string, cb: (code: number) => void) => cb(0),
      }),
    );
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

  it("publishes upgrade for valid token and shop id", async () => {
    const token = jwt.sign({}, "testsecret");
    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
