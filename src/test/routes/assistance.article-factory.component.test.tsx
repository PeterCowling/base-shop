import { assertRouteHead } from "@tests/head";
import { ensureTestNamespaces } from "@tests/i18n";
import { renderRouteModule } from "@tests/renderers";
import i18n from "@/i18n";
import bookingBasicsEn from "@/locales/en/bookingBasics.json";
import * as BookingBasicsRoute from "@/routes/assistance/booking-basics";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalTitle = "Original Title";

vi.mock("@acme/ui/organisms/AssistanceArticleSection", () => ({
  __esModule: true,
  default: ({ namespace }: { namespace: string }) => (
    <article data-testid={`article-${namespace}`} />
  ),
}));

vi.mock("@/components/guides/RelatedGuides", () => ({
  __esModule: true,
  default: ({ items }: { items?: Array<unknown> }) => (
    <div data-testid="related-guides" data-count={items?.length ?? 0} />
  ),
}));

beforeAll(async () => {
  await ensureTestNamespaces("en", ["bookingBasics", "guides", "translation"]);
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  document.title = originalTitle;
});

afterEach(() => {
  document.title = originalTitle;
});

const renderBookingBasics = async (overrides?: { loaderData?: unknown }) => {
  const view = await renderRouteModule(BookingBasicsRoute, {
    route: "/en/help/booking-basics",
    ...overrides,
  });
  await view.ready();
  return view;
};

describe("assistance article page (booking basics)", () => {
  it("prefers loader metadata when loader data is provided", async () => {
    const view = await renderBookingBasics({
      loaderData: { lang: "en", title: "Loader title", desc: "Loader description" },
    });

    expect(document.title).toBe("Loader title");
    assertRouteHead({
      title: "Loader title",
      description: "Loader description",
      path: "/en/help/booking-basics",
      lang: "en",
      image: {},
      ogType: "article",
    });
    view.unmount();
  });

  it("falls back to localized meta when loader data is unavailable", async () => {
    await renderBookingBasics();

    assertRouteHead({
      title: bookingBasicsEn.meta.title,
      description: bookingBasicsEn.meta.description,
      path: "/en/help/booking-basics",
      lang: "en",
      image: {},
      ogType: "article",
    });
    expect(document.title).toBe(bookingBasicsEn.meta.title);
  });
});