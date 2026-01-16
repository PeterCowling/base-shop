import { screen } from "@testing-library/react";
import { renderRouteModule } from "@tests/renderers";
import { ensureTestNamespaces } from "@tests/i18n";
import { describe, it, beforeEach, expect } from "vitest";
import i18n from "@/i18n";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";
import * as ExperiencesRoute from "@/routes/experiences";
import experiencesPageEn from "@/locales/en/experiencesPage.json";
import tokensEn from "@/locales/en/_tokens.json";
import guidesEn from "@/locales/en/guides.json";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const renderExperiences = async (route = "/en/experiences") => {
  const view = await renderRouteModule(ExperiencesRoute, { route });
  await view.ready();
  await screen.findByRole("heading", { level: 1 });
  return view;
};

describe("/experiences route", () => {
  beforeEach(async () => {
    await ensureTestNamespaces("en", ["experiencesPage", "_tokens", "guides"]);
    i18n.addResourceBundle("en", "experiencesPage", clone(experiencesPageEn), true, true);
    i18n.addResourceBundle("en", "_tokens", clone(tokensEn), true, true);
    i18n.addResourceBundle("en", "guides", clone(guidesEn), true, true);
  });

  it("renders hero content, sections, and calls to action", async () => {
    await renderExperiences();

    expect(
      screen.getByRole("heading", { level: 1, name: /Sunsets, slow mornings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Everything is open to registered guests/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: /Sunset terrace bar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Guided hikes & day trips/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Always-on digital concierge/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Book your stay at Hostel Brikette/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View the breakfast menu/i })).toBeInTheDocument();

    const guidesTranslator = i18n.getFixedT("en", "guides");
    const backpackerLabel = getGuideLinkLabel(
      guidesTranslator,
      guidesTranslator,
      "backpackerItineraries",
    );
    expect(screen.getByText(backpackerLabel)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: /Frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it("derives tagged copy, handles empty filters, and falls back when tokens are missing", async () => {
    const customizedExperiences = clone(experiencesPageEn);
    customizedExperiences.hero = {
      ...(customizedExperiences.hero as Record<string, unknown>),
      secondaryCta: "See our latest bar menu",
      tertiaryCta: "",
      breakfastCta: "",
      breakfastCtaAria: "",
    };
    customizedExperiences.faq = {
      ...(customizedExperiences.faq as Record<string, unknown>),
      items: [],
    };
    customizedExperiences.cta = {
      ...(customizedExperiences.cta as Record<string, unknown>),
      buttons: {
        ...(customizedExperiences.cta as { buttons: Record<string, string> }).buttons,
        book: "Reserve direct with us",
      },
    };
    i18n.addResourceBundle("en", "experiencesPage", customizedExperiences, true, true);

    const customizedTokens = {
      ...clone(tokensEn),
      bookNow: "bookNow",
      openBarMenu: "openBarMenu",
    };
    i18n.addResourceBundle("en", "_tokens", customizedTokens, true, true);

    await renderExperiences("/en/experiences?tag=hidden-gems");

    expect(
      await screen.findByRole("heading", { level: 2, name: /experiences tagged #hidden-gems/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/We don’t have experience guides for #hidden-gems yet/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Show all experiences guides/i }),
    ).toHaveAttribute("href", "/en/experiences");

    expect(
      await screen.findByRole("link", { name: /Reserve direct with us/i }),
    ).toBeInTheDocument();
    const barMenuLink = document.querySelector('a[href="/en/bar-menu"]');
    expect(barMenuLink).not.toBeNull();
    expect(barMenuLink?.textContent?.trim()).toBe("See our latest bar menu");
    expect(document.querySelectorAll('a[href="/en/breakfast-menu"]').length).toBe(1);
    expect(
      await screen.findByRole("link", { name: /Breakfast menu/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Message the digital concierge/i })).toBeNull();

    const faqScript = document.querySelector("script[suppresshydrationwarning]");
    expect(faqScript).toBeNull();
  });

  it("splits beach filters into guides and directions", async () => {
    await renderExperiences("/en/experiences?tag=beaches");

    expect(
      await screen.findByRole("heading", { level: 2, name: /Beach guides/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 2, name: /Beach directions/i }),
    ).toBeInTheDocument();

    const filterHeadings = screen.getAllByRole("heading", {
      level: 3,
      name: /Filter experiences guides/i,
    });
    expect(filterHeadings).toHaveLength(1);
  });
});