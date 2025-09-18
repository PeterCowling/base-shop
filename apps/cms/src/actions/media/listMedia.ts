"use server";

import type { MediaItem } from "@acme/types";

import { ensureAuthorized } from "../common/auth";
import { collectMediaItems } from "./mediaUtils";

export async function listMedia(shop: string): Promise<MediaItem[]> {
  await ensureAuthorized();

  try {
    return await collectMediaItems(shop);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }
    console.error("Failed to list media", err);
    throw new Error("Failed to list media");
  }
}
