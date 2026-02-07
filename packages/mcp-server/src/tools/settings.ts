import { z } from "zod";

import {
  errorResult,
  formatError,
  jsonResult,
  shopIdSchema,
} from "../utils/validation.js";

const getSettingsSchema = shopIdSchema;

const updateSettingsSchema = z.object({
  shopId: z.string().min(1),
  settings: z.record(z.unknown()),
});

export const settingsTools = [
  {
    name: "settings_get",
    description: "Get settings for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
  {
    name: "settings_update",
    description: "Update settings for a shop (merge with existing)",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        settings: { type: "object", description: "Settings to merge" },
      },
      required: ["shopId", "settings"],
    },
  },
] as const;

export async function handleSettingsTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "settings_get": {
        const { shopId } = getSettingsSchema.parse(args);
        const { getShopSettings } = await import(
          "@acme/platform-core/repositories/shops.server"
        );
        const settings = await getShopSettings(shopId);
        return jsonResult(settings);
      }

      case "settings_update": {
        const { shopId, settings } = updateSettingsSchema.parse(args);
        const { getShopSettings, saveShopSettings } = await import(
          "@acme/platform-core/repositories/shops.server"
        );
        const current = await getShopSettings(shopId);
        const merged = { ...current, ...settings };
        await saveShopSettings(shopId, merged as never);
        return jsonResult({ success: true, settings: merged });
      }

      default:
        return errorResult(`Unknown settings tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
