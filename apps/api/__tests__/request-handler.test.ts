import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";

import { createRequestHandler } from "./test-utils";

const componentsHandlerMock = jest.fn();
const publishUpgradeMock = jest.fn();

jest.mock("../src/routes/components/[shopId]", () => ({
  onRequest: componentsHandlerMock,
}));

jest.mock("../src/routes/shop/[id]/publish-upgrade", () => ({
  onRequestPost: publishUpgradeMock,
}));

describe("createRequestHandler", () => {
  beforeEach(() => {
    componentsHandlerMock.mockReset();
    publishUpgradeMock.mockReset();
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
    expect(componentsHandlerMock).not.toHaveBeenCalled();
    expect(publishUpgradeMock).not.toHaveBeenCalled();
  });

  it("handles GET /components/:shopId", async () => {
    const handler = createRequestHandler();

    componentsHandlerMock.mockResolvedValue(
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
    expect(componentsHandlerMock).toHaveBeenCalledTimes(1);

    const call = componentsHandlerMock.mock.calls[0][0];
    expect(call.params).toEqual({ shopId: "cover-me-pretty" });
    expect(call.request.method).toBe("GET");

    expect(publishUpgradeMock).not.toHaveBeenCalled();
  });

  it("handles POST /shop/:id/publish-upgrade", async () => {
    const handler = createRequestHandler();

    publishUpgradeMock.mockResolvedValue(
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
    expect(publishUpgradeMock).toHaveBeenCalledTimes(1);

    const call = publishUpgradeMock.mock.calls[0][0];
    expect(call.params).toEqual({ id: "123" });
    expect(call.request.method).toBe("POST");

    expect(componentsHandlerMock).not.toHaveBeenCalled();
  });
});
