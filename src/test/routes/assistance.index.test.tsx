import { screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { ensureTestNamespaces } from "@tests/i18n";
import { renderRouteModule } from "@tests/renderers";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as AssistanceRoute from "@/routes/assistance";

const quickLinksCalls = vi.hoisted(() => ({ value: [] as Array<{ lang: string }> }));
const guideCollectionCalls = vi.hoisted(() => ({ value: [] as Array<Record<string, unknown>> }));

vi.mock("@/components/assistance/quick-links-section", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => {
    quickLinksCalls.value.push({ lang });
    return <div data-testid="quick-links" data-lang={lang} />;
  },
}));

vi.mock("@/components/guides/GuideCollection", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    guideCollectionCalls.value.push(props);
    return <div data-testid="guide-collection" data-props={JSON.stringify(props)} />;
  },
}));

vi.mock("@/components/seo/FaqStructuredData", () => ({
  __esModule: true,
  default: () => <script data-testid="faq-jsonld" />,
}));

vi.mock("@/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: vi.fn((src: string) => `https://cdn.example${src}`),
}));

beforeAll(async () => {
  const namespaces = ["assistanceSection", "guides", "translation", "howToGetHere", "experiencesPage"] as const;
  await ensureTestNamespaces("en", namespaces);
  await ensureTestNamespaces("fr", namespaces);
});

beforeEach(() => {
  quickLinksCalls.value = [];
  guideCollectionCalls.value = [];
});

const renderAssistanceIndex = (route: string) => renderRouteModule(AssistanceRoute, { route });

describe("/assistance index route", () => {
  it("renders localized hero content and booking links for the French locale", async () => {
    await renderAssistanceIndex("/fr/assistance");

    const hero = await screen.findByRole("heading", { level: 1 });
    expect(hero).toHaveTextContent(/Assistance Numérique/i);
    expect(screen.getByText(/Autres options de réservation/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Google Business" })).toHaveAttribute(
      "href",
      expect.stringContaining("google"),
    );
    expect(screen.getByRole("link", { name: "Booking.com" })).toHaveAttribute(
      "href",
      expect.stringContaining("booking.com"),
    );

    expect(quickLinksCalls.value[0]?.lang).toBe("fr");

    assertRouteHead({
      title: "Contact et informations | Brikette Hostel Positano",
      description:
        "Réservez, explorez et connectez-vous avec nous en ligne. Des questions? Notre assistant numérique offre des recommandations sur mesure et des guides de voyage pour améliorer votre séjour à Positano.",
      path: "/fr/assistance",
      lang: "fr",
      image: {},
    });
  });

  it("surfaces filtered guide content and clear-filter links when a tag is present", async () => {
    await renderAssistanceIndex("/en/assistance?tag=planning");

    expect(screen.getByRole("heading", { name: /Help Centre/i })).toBeInTheDocument();
    expect(screen.getByTestId("quick-links")).toHaveAttribute("data-lang", "en");

    const lastGuideCall = guideCollectionCalls.value.at(-1) ?? {};
    expect(lastGuideCall).toMatchObject({
      filterTag: "planning",
      clearFilterHref: "/en/help",
    });
  });
});