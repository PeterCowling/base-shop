/** @jest-environment node */
import "ts-node/register";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { rest } from "msw";
import { server as mswServer } from "../../test/msw/server";
import { sendStripeTestEvent } from "../stripe-send-test-event.ts";

describe("stripe-send-test-event script", () => {
  it("POSTs fixture to provided webhook URL", async () => {
    const received: any[] = [];
    const webhookServer = createServer((req, res) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        received.push(JSON.parse(data));
        res.statusCode = 200;
        res.end("ok");
      });
    });

    await new Promise<void>((resolve) => webhookServer.listen(0, resolve));
    const port = (webhookServer.address() as AddressInfo).port;
    const url = `http://localhost:${port}`;

    // allow MSW to passthrough to local server
    mswServer.use(rest.post(url, (req) => req.passthrough()));

    const res = await sendStripeTestEvent("checkout.session.completed", url);
    expect(res.status).toBe(200);
    expect(received[0].type).toBe("checkout.session.completed");

    webhookServer.close();
  });
});
