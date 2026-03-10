/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import { readFileSync } from "node:fs";
import path from "node:path";

import { type AppLanguage, i18nConfig } from "@/i18n.config";

type HeaderLocale = {
  apartment?: string;
  title?: string;
};

type BookPageLocale = {
  apartment?: {
    meta?: {
      description?: string;
      title?: string;
    };
  };
};

type ApartmentPageLocale = {
  body?: string;
  book?: {
    meta?: {
      description?: string;
    };
  };
};

type RoomsPageLocale = {
  rooms?: {
    double_room?: {
      bed_intro?: string;
    };
  };
};

const LOCALES_ROOT = path.resolve(__dirname, "../../locales");
const SUPPORTED_LANGUAGES = i18nConfig.supportedLngs as AppLanguage[];

function readLocale<T>(lang: AppLanguage, namespace: string): T {
  const filePath = path.join(LOCALES_ROOT, lang, `${namespace}.json`);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("commercial booking metadata", () => {
  it.each(SUPPORTED_LANGUAGES)("hostel booking routes stay indexable for %s", async (lang) => {
    const bookModule = await import("@/app/[lang]/book/page");
    const dormBedModule = await import("@/app/[lang]/book-dorm-bed/page");

    const bookMetadata = await bookModule.generateMetadata({
      params: Promise.resolve({ lang }),
    });
    const dormBedMetadata = await dormBedModule.generateMetadata({
      params: Promise.resolve({ lang }),
    });

    expect(bookMetadata.robots).toBeUndefined();
    expect(dormBedMetadata.robots).toBeUndefined();
  });

  it.each(SUPPORTED_LANGUAGES)(
    "private accommodations metadata uses locale-safe copy for %s",
    async (lang) => {
      const privateBookingModule = await import("@/app/[lang]/book-private-accommodations/page");

      const header = readLocale<HeaderLocale>(lang, "header");
      const bookPage = readLocale<BookPageLocale>(lang, "bookPage");
      const apartmentPage = readLocale<ApartmentPageLocale>(lang, "apartmentPage");
      const roomsPage = readLocale<RoomsPageLocale>(lang, "roomsPage");

      const expectedTitle =
        bookPage.apartment?.meta?.title ||
        [header.apartment ?? "", header.title ?? "Hostel Brikette"].filter(Boolean).join(" | ");
      const expectedDescription =
        bookPage.apartment?.meta?.description ||
        apartmentPage.book?.meta?.description ||
        [roomsPage.rooms?.double_room?.bed_intro, apartmentPage.body].filter(Boolean).join(" ");

      const metadata = await privateBookingModule.generateMetadata({
        params: Promise.resolve({ lang }),
      });

      expect(metadata.title).toBe(expectedTitle);
      expect(metadata.description).toBe(expectedDescription);
      expect(metadata.robots).toBeUndefined();
    }
  );
});
