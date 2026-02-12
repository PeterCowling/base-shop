import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";

import * as componentsModule from "../src/routes/components/[shopId]";
import * as publishUpgradeModule from "../src/routes/shop/[id]/publish-upgrade";

import { createRequestHandler } from "./test-utils";

jest.mock("../src/routes/components/[shopId]", () => ({
  onRequest: jest.fn(),
}));

jest.mock("../src/routes/shop/[id]/publish-upgrade", () => ({
  onRequestPost: jest.fn(),
}));

const mockComponentsHandler = jest.mocked(componentsModule.onRequest);
const mockPublishUpgrade = jest.mocked(publishUpgradeModule.onRequestPost);

describe("createRequestHandler", () => {
  beforeEach(() => {
    mockComponentsHandler.mockReset();
    mockPublishUpgrade.mockReset();
  });

  it("returns 404 for unknown routes", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/unknown";
    req.method = "POST";
    req.headers = {};

    const end = jest.fn();
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      end,
    } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalled();
    expect(mockComponentsHandler).not.toHaveBeenCalled();
    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });

  it("handles GET /components/:shopId", async () => {
    const handler = createRequestHandler();

    mockComponentsHandler.mockResolvedValue(
      new Response("components", { status: 201 }),
    );

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/components/cover-me-pretty";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      end,
    } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(end).toHaveBeenCalledWith("components");
    expect(mockComponentsHandler).toHaveBeenCalledTimes(1);

    const call = mockComponentsHandler.mock.calls[0][0];
    expect(call.params).toEqual({ shopId: "cover-me-pretty" });
    expect(call.request.method).toBe("GET");

    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });

  it("handles POST /shop/:id/publish-upgrade", async () => {
    const handler = createRequestHandler();

    mockPublishUpgrade.mockResolvedValue(
      new Response("published", { status: 202 }),
    );

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/shop/123/publish-upgrade";
    req.method = "POST";
    req.headers = {};

    const end = jest.fn();
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      end,
    } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(202);
    expect(end).toHaveBeenCalledWith("published");
    expect(mockPublishUpgrade).toHaveBeenCalledTimes(1);

    const call = mockPublishUpgrade.mock.calls[0][0];
    expect(call.params).toEqual({ id: "123" });
    expect(call.request.method).toBe("POST");

    expect(mockComponentsHandler).not.toHaveBeenCalled();
  });
});
