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
  let OriginalRequest: typeof Request;
  let RequestMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    OriginalRequest = global.Request;
    RequestMock = jest.fn((input: RequestInfo, init?: RequestInit) => new OriginalRequest(input, init));
    (global as any).Request = RequestMock;
  });

  afterEach(() => {
    (global as any).Request = OriginalRequest;
  });

  it("joins array header values", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/unknown";
    req.method = "GET";
    req.headers = { "x-multi": ["a", "b"] } as unknown as IncomingMessage["headers"];

    const end = jest.fn();
    const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(RequestMock).toHaveBeenCalled();
    const headers = (RequestMock.mock.calls[0][1]!.headers as Headers) || new Headers();
    expect(headers.get("x-multi")).toBe("a,b");
  });

  it("omits headers with undefined values", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/unknown";
    req.method = "GET";
    req.headers = { "x-empty": undefined } as unknown as IncomingMessage["headers"];

    const end = jest.fn();
    const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(RequestMock).toHaveBeenCalled();
    const headers = (RequestMock.mock.calls[0][1]!.headers as Headers) || new Headers();
    expect(headers.has("x-empty")).toBe(false);
  });

  it("uses undefined body when request lacks body", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/unknown";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(RequestMock).toHaveBeenCalled();
    expect(RequestMock.mock.calls[0][1]!.body).toBeUndefined();
  });

  it("uses provided body when request has body", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push("hello");
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/unknown";
    req.method = "POST";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(RequestMock).toHaveBeenCalled();
    const body = RequestMock.mock.calls[0][1]!.body as Uint8Array;
    expect(Buffer.from(body).toString()).toBe("hello");
    expect(res.statusCode).toBe(404);
  });

  it("handles GET /components/:shopId", async () => {
    mockComponentsHandler.mockResolvedValueOnce(new Response("OK", { status: 200 }));
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/components/bcd";
    req.method = "GET";
    req.headers = { authorization: "Bearer token" } as unknown as IncomingMessage["headers"];

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(mockComponentsHandler).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(end).toHaveBeenCalledWith("OK");
  });

  it("forwards response headers", async () => {
    mockComponentsHandler.mockResolvedValueOnce(
      new Response("OK", { status: 200, headers: { "X-Test": "value" } }),
    );
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/components/bcd";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("x-test", "value");
  });

  it("returns 404 for GET /components without ID", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/components";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalled();
    expect(mockComponentsHandler).not.toHaveBeenCalled();
    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });

  it("returns 404 for PUT /components/:shopId", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/components/bcd";
    req.method = "PUT";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalled();
    expect(mockComponentsHandler).not.toHaveBeenCalled();
    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });

  it("handles POST /shop/:id/publish-upgrade", async () => {
    mockPublishUpgrade.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/shop/bcd/publish-upgrade";
    req.method = "POST";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(mockPublishUpgrade).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(end).toHaveBeenCalledWith("");
  });

  it("returns 404 for GET /shop/:id/publish-upgrade", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/shop/bcd/publish-upgrade";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalledWith();
    expect(mockComponentsHandler).not.toHaveBeenCalled();
    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });

  it("returns 404 for unrecognized path", async () => {
    const handler = createRequestHandler();

    const req = new Readable({
      read() {
        this.push(null);
      },
    }) as unknown as IncomingMessage;
    req.url = "/not-found";
    req.method = "GET";
    req.headers = {};

    const end = jest.fn();
    const res = { statusCode: 0, setHeader: jest.fn(), end } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalled();
    expect(mockComponentsHandler).not.toHaveBeenCalled();
    expect(mockPublishUpgrade).not.toHaveBeenCalled();
  });
});

