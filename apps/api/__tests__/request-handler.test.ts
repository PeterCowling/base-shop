import { Readable } from "stream";
import type { IncomingMessage, ServerResponse } from "http";

const componentsHandlerMock = jest.fn();
const publishUpgradeMock = jest.fn();

jest.mock("../src/routes/components/[shopId]", () => ({
  onRequest: componentsHandlerMock,
}));

jest.mock("../src/routes/shop/[id]/publish-upgrade", () => ({
  onRequestPost: publishUpgradeMock,
}));

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
});
