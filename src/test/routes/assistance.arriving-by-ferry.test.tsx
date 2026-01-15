import { findJsonLdByType } from "@tests/jsonld";
import { renderRouteModule } from "@tests/renderers";
import * as ArrivingByFerryRoute from "@/routes/assistance/arriving-by-ferry";
import { describe, expect, it, vi, beforeAll } from "vitest";
import { ensureTestNamespaces } from "@tests/i18n";

vi.mock("@acme/ui/organisms/AssistanceArticleSection", () => ({
  __esModule: true,
  default: ({ namespace }: { namespace: string }) => (
    <article data-testid={`article-${namespace}`} />
  ),
}));

const renderArrivingByFerry = async (nsOverride?: unknown) => {
  if (nsOverride) {
    translationOverrides.arrivingByFerry = nsOverride;
  } else {
    translationOverrides.arrivingByFerry = undefined;
  }
  const view = await renderRouteModule(ArrivingByFerryRoute, {
    route: "/en/help/arriving-by-ferry",
  });
  await view.ready();
  return view;
};

const translationOverrides: Record<string, unknown> = {};

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: (namespace: string, opts?: { lng?: string }) => {
      const base = actual.useTranslation(namespace, opts);
      return {
        ...base,
        t: (key: string, options?: Record<string, unknown>) => {
          const overrides = translationOverrides[namespace];
          if (overrides && typeof overrides === "object") {
            const value = (overrides as Record<string, unknown>)[key];
            if (options?.returnObjects) return value ?? options.defaultValue;
            if (typeof value === "string") return value;
          }
          return base.t(key, options as any);
        },
      };
    },
  };
});

beforeAll(async () => {
  await ensureTestNamespaces("en", ["arrivingByFerry", "guides", "translation"]);
});

describe("assistance arriving-by-ferry article", () => {
  it("serializes valid FAQ entries and ignores malformed ones", async () => {
    await renderArrivingByFerry({
      "faq.items": [
        { question: "What time do ferries arrive?", answer: "Hourly" },
        { question: "", answer: "Missing" },
        null,
        { question: "Only answer" },
      ],
    });

    const payload = findJsonLdByType("FAQPage") as { mainEntity?: Array<Record<string, unknown>> } | undefined;
    expect(payload).toBeTruthy();
    const entries = payload?.mainEntity ?? [];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.name).toBe("What time do ferries arrive?");
  });

  it("falls back to an empty FAQ array when translations return unexpected values", async () => {
    await renderArrivingByFerry({
      "faq.items": "not an array",
    });

    const payload = findJsonLdByType("FAQPage") as { mainEntity?: Array<unknown> } | undefined;
    expect(payload).toBeTruthy();
    expect(Array.isArray(payload?.mainEntity)).toBe(true);
    expect(payload?.mainEntity).toHaveLength(0);
  });
});