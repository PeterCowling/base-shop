import http from "node:http";

import { handleBuildPacket } from "./routes/buildPacket";
import { handlePrice } from "./routes/price";
import { handleSchema } from "./routes/schema";
import { handleValidate } from "./routes/validate";
import { parseJsonBody } from "./utils/http";

const PORT = Number(process.env.PORT ?? 3017);

function setCorsHeaders(res: http.ServerResponse, origin?: string) {
  res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] protocol header value
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer((req, res) => {
  try {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!req.url || !req.headers.host) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
      res.end(JSON.stringify({ error: "Missing URL" }));
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/config/schema") {
      void handleSchema({ req, res, url });
      return;
    }

    if (req.method === "POST" && url.pathname === "/config/validate") {
      void handleValidate({ req, res, parseJsonBody });
      return;
    }

    if (req.method === "POST" && url.pathname === "/config/price") {
      void handlePrice({ req, res, parseJsonBody });
      return;
    }

    if (req.method === "POST" && url.pathname === "/order/buildPacket") {
      void handleBuildPacket({ req, res, parseJsonBody });
      return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    res.end(JSON.stringify({ error: "Not found" }));
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    res.end(JSON.stringify({ error: "Internal error" }));
  }
});

server.listen(PORT, () => {
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] developer startup log
  console.info(`[handbag-configurator-api] listening on http://localhost:${PORT}`);
});
