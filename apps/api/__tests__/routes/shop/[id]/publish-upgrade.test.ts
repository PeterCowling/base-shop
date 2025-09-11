import request from "supertest";
import jwt from "jsonwebtoken";
import * as fs from "fs";
import * as childProcess from "child_process";
jest.mock("fs");
jest.mock("child_process");
import { createRequestHandler } from "../../../test-utils";

describe("publish-upgrade route", () => {
  beforeAll(() => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
  });

  afterEach(() => {
    jest.resetAllMocks();
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

  it("rejects invalid bearer token", async () => {
    const res = await request(createRequestHandler())
      .post("/shop/abc/publish-upgrade")
      .set("Authorization", "Bearer invalid");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects token signed with wrong secret", async () => {
    const token = jwt.sign({}, "wrongsecret");
    const res = await request(createRequestHandler())
      .post("/shop/abc/publish-upgrade")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("publishes upgrade with valid token", async () => {
    const token = jwt.sign({}, process.env.UPGRADE_PREVIEW_TOKEN_SECRET ?? "");

    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      const p = String(file);
      if (p.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { foo: "1.0.0" } });
      }
      if (p.endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "";
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (childProcess.spawn as jest.Mock).mockImplementation(
      () =>
        ({
          on: (_ev, cb) => {
            cb(0);
            return undefined as any;
          },
        }) as any,
    );

    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("locks all dependencies when components are omitted", async () => {
    const token = jwt.sign({}, process.env.UPGRADE_PREVIEW_TOKEN_SECRET ?? "");

    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      const p = String(file);
      if (p.endsWith("package.json")) {
        return JSON.stringify({
          dependencies: { foo: "1.0.0", bar: "2.0.0" },
        });
      }
      if (p.endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "";
    });
    let written = "";
    (fs.writeFileSync as jest.Mock).mockImplementation((_file, data) => {
      written = String(data);
    });
    (childProcess.spawn as jest.Mock).mockImplementation(
      () =>
        ({
          on: (_ev, cb) => {
            cb(0);
            return undefined as any;
          },
        }) as any,
    );

    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    const shop = JSON.parse(written);
    expect(shop.componentVersions).toEqual({
      foo: "1.0.0",
      bar: "2.0.0",
    });
  });

  it("returns 500 when build fails", async () => {
    const token = jwt.sign({}, process.env.UPGRADE_PREVIEW_TOKEN_SECRET ?? "");

    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      const p = String(file);
      if (p.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { foo: "1.0.0" } });
      }
      if (p.endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "";
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (childProcess.spawn as jest.Mock).mockImplementation(
      () =>
        ({
          on: (_ev, cb) => {
            cb(1);
            return undefined as any;
          },
        }) as any,
    );

    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error:
        "pnpm --filter apps/shop-valid-id build failed with status 1",
    });
  });

  it("returns 500 when deploy fails", async () => {
    const token = jwt.sign({}, process.env.UPGRADE_PREVIEW_TOKEN_SECRET ?? "");

    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      const p = String(file);
      if (p.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { foo: "1.0.0" } });
      }
      if (p.endsWith("shop.json")) {
        return JSON.stringify({});
      }
      return "";
    });
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (childProcess.spawn as jest.Mock)
      .mockImplementationOnce(
        () =>
          ({
            on: (_ev, cb) => {
              cb(0);
              return undefined as any;
            },
          }) as any,
      )
      .mockImplementationOnce(
        () =>
          ({
            on: (_ev, cb) => {
              cb(1);
              return undefined as any;
            },
          }) as any,
      );

    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error:
        "pnpm --filter apps/shop-valid-id deploy failed with status 1",
    });
  });

  it("returns 500 when fs throws string error", async () => {
    const token = jwt.sign({}, process.env.UPGRADE_PREVIEW_TOKEN_SECRET ?? "");

    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw "fail";
    });

    const res = await request(createRequestHandler())
      .post("/shop/valid-id/publish-upgrade")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "fail" });
  });
});
