import { Readable } from "stream";
import type { IncomingMessage, ServerResponse } from "http";
import { createRequestHandler } from "./test-utils";

describe("createRequestHandler", () => {
  it("returns 404 for unknown routes", async () => {
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
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      end,
    } as unknown as ServerResponse;

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(end).toHaveBeenCalled();
  });
});
