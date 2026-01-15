import type http from "node:http";
import {
  productConfigSchemaSchema,
  selectionStateSchema,
} from "@acme/product-configurator";
import { loadProductJson } from "../storage/products";
import { writeJson } from "../utils/http";
import { normalizeSelections } from "../engine/normalize";
import {
  resolveManufacturingMatch,
  type ManufacturingMap,
} from "../engine/manufacturingMap";

export async function handleBuildPacket({
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

    const schema = productConfigSchemaSchema.parse(
      await loadProductJson(productId, "config.schema.json"),
    );
    const normalizedSelections = normalizeSelections(
      schema,
      selectionStateSchema.parse(selections),
    ).normalizedSelections;

    const map = (await loadProductJson(
      productId,
      "manufacturing.map.json",
    )) as ManufacturingMap;

    const match = resolveManufacturingMatch(normalizedSelections, map);

    if (!match?.sku || !Array.isArray(match.bom)) {
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
      writeJson(res, 404, { error: "No manufacturing mapping found" });
      return;
    }

    writeJson(res, 200, {
      productId,
      selections: normalizedSelections,
      sku: match.sku,
      bom: match.bom,
      productionNotes: match.productionNotes ?? [],
    });
  } catch {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    writeJson(res, 400, { error: "Invalid request" });
  }
}
