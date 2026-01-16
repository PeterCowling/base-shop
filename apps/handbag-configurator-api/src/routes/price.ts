import type http from "node:http";
import {
  productConfigSchemaSchema,
  selectionStateSchema,
} from "@acme/product-configurator";
import { loadProductJson } from "../storage/products";
import { writeJson } from "../utils/http";
import { normalizeSelections } from "../engine/normalize";

export async function handlePrice({
  req,
  res,
  parseJsonBody,
}: {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  parseJsonBody: typeof import("../utils/http").parseJsonBody;
}) {
  try {
    const payload = await parseJsonBody(req);
    if (!payload || typeof payload !== "object") {
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
      throw new Error("invalid");
    }

    const productId = (payload as { productId?: unknown }).productId;
    const selections = (payload as { selections?: unknown }).selections;
    if (typeof productId !== "string") {
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
      throw new Error("invalid productId");
    }

    const pricing = await loadProductJson(productId, "pricing.json");

    const schemaRaw = await loadProductJson(productId, "config.schema.json");
    const schema = productConfigSchemaSchema.parse(schemaRaw);
    const normalizedSelections = normalizeSelections(
      schema,
      selectionStateSchema.parse(selections),
    ).normalizedSelections;

    const basePrice = Number((pricing as { basePrice?: unknown }).basePrice ?? 0);
    const currency = String((pricing as { currency?: unknown }).currency ?? "USD");

    const deltas: Record<string, number> = {};
    let total = basePrice;

    for (const property of schema.properties) {
      const selected = normalizedSelections[property.key] ?? property.defaultValue;
      const entry = property.values.find((v) => v.value === selected);
      const delta = entry?.priceDelta ?? 0;
      deltas[property.key] = delta;
      total += delta;
    }

    writeJson(res, 200, {
      productId,
      currency,
      basePrice,
      selections: normalizedSelections,
      deltas,
      totalPrice: total,
    });
  } catch {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    writeJson(res, 400, { error: "Invalid request" });
  }
}
