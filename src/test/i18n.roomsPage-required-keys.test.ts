// src/test/i18n.roomsPage-required-keys.test.ts
// Ensures the Rooms page always defines the sold-out label per locale so the UI
// never renders the raw `rooms.soldOut` key again.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { i18nConfig } from "@/i18n.config";

const LOCALES_DIR = path.join(process.cwd(), "src", "locales");
const REQUIRED_KEY_PATH = ["rooms", "soldOut"] as const;

function readRoomsPage(lang: (typeof i18nConfig.supportedLngs)[number]) {
  const file = path.join(LOCALES_DIR, lang, "roomsPage.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("roomsPage rooms.soldOut", () => {
  it("provides a translated label for every supported locale", () => {
    const missing: string[] = [];
    const placeholders: string[] = [];

    for (const lang of i18nConfig.supportedLngs) {
      const data = readRoomsPage(lang);
      const rooms = (data.rooms ?? {}) as Record<string, unknown>;
      const soldOut = rooms[REQUIRED_KEY_PATH[1]];

      if (typeof soldOut !== "string" || soldOut.trim().length === 0) {
        missing.push(`${lang}: expected non-empty string, received ${typeof soldOut}`);
        continue;
      }

      if (soldOut.trim() === `${REQUIRED_KEY_PATH.join(".")}`) {
        placeholders.push(`${lang}: value equals translation key (${soldOut})`);
      }
    }

    expect(missing).toEqual([]);
    expect(placeholders).toEqual([]);
  });
});