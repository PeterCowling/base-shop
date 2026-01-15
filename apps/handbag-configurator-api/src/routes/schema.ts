import type http from "node:http";
import { productConfigSchemaSchema } from "@acme/product-configurator";
import { loadProductJson } from "../storage/products";
import { writeJson } from "../utils/http";

export async function handleSchema({
  res,
  url,
}: {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: URL;
}) {
  const productId = url.searchParams.get("productId") ?? "";
  try {
    const raw = await loadProductJson(productId, "config.schema.json");
    const schema = productConfigSchemaSchema.parse(raw);
    writeJson(res, 200, schema);
  } catch {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    writeJson(res, 404, { error: "Schema not found" });
  }
}
