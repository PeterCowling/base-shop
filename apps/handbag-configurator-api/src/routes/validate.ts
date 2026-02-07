import type http from "node:http";

import {
  productConfigSchemaSchema,
  selectionStateSchema,
} from "@acme/product-configurator";

import { validateSelections } from "../engine/rulesEngine";
import type { RuleDefinition } from "../engine/types";
import { loadProductJson } from "../storage/products";
import { writeJson } from "../utils/http";

const requestSchema = {
  parse(payload: unknown): { productId: string; selections: Record<string, string> } {
    if (
      !payload ||
      typeof payload !== "object" ||
      !("productId" in payload) ||
      !("selections" in payload)
    ) {
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
      throw new Error("invalid payload");
    }
    const productId = (payload as { productId?: unknown }).productId;
    const selections = (payload as { selections?: unknown }).selections;
    if (typeof productId !== "string") {
      // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
      throw new Error("invalid productId");
    }
    return {
      productId,
      selections: selectionStateSchema.parse(selections),
    };
  },
};

export async function handleValidate({
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
    const { productId, selections } = requestSchema.parse(payload);

    const rawSchema = await loadProductJson(productId, "config.schema.json");
    const schema = productConfigSchemaSchema.parse(rawSchema);
    const rawRules = await loadProductJson(productId, "rules.json");
    const rules = (rawRules as { rules?: RuleDefinition[] }).rules ?? [];

    const response = validateSelections({
      schema,
      rules,
      selections,
    });

    writeJson(res, 200, response);
  } catch {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] API error response
    writeJson(res, 400, { error: "Invalid request" });
  }
}
