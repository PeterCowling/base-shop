"use server";

import { ensureAuthorized } from "../common/auth";
import { buildOverview, collectMediaItems, type MediaOverview } from "./mediaUtils";

export async function getMediaOverview(shop: string): Promise<MediaOverview> {
  await ensureAuthorized();

  try {
    const files = await collectMediaItems(shop);
    return buildOverview(files);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return buildOverview([]);
    }
    console.error("Failed to load media overview", err);
    throw new Error("Failed to load media overview");
  }
}
