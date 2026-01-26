import "@testing-library/jest-dom";

import { renderWithProviders } from "@tests/renderers";

import AssistanceFaqJsonLd from "@/components/seo/AssistanceFaqJsonLd";
import DealsStructuredData from "@/components/seo/DealsStructuredData";
import GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";

let pathname = "/en";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useParams: () => ({ lang: "en" }),
}));

jest.mock("@/routes/deals/status", () => ({
  getDealStatus: () => "active",
}));

const assistanceFaqItems = [
  { q: "Can I bring <b>guests</b>?</script>", a: ["Only registered guests are allowed."] },
];

const guideFaqItems = [
  { question: "How long is the hike?", answer: ["About 2 hours."] },
];

jest.mock("react-i18next", () => ({
  useTranslation: (ns: string) => {
    const t = (key: string, options?: Record<string, unknown>) => {
      if (options?.returnObjects) {
        if (ns === "arrivingByFerry" && key === "faq.items") return assistanceFaqItems;
        if (ns === "guides" && key === "content.ferrySchedules.faqs") return guideFaqItems;
        return [];
      }
      if (options && typeof options.defaultValue === "string") {
        return options.defaultValue;
      }
      return key;
    };
    return { t, ready: true };
  },
}));

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  const raw = script.innerHTML;
  return JSON.parse(raw) as Record<string, unknown>;
};

describe("JSON-LD contract: representative pages", () => {
  it("home JSON-LD uses canonical home URL", () => {
    pathname = "/en";
    const { container } = renderWithProviders(<HomeStructuredData />);
    const json = getJsonLd(container);
    const hotel = json["hotel"] as Record<string, unknown>;
    expect(hotel?.mainEntityOfPage).toBe(`${BASE_URL}/en`);
  });

  it("assistance FAQ JSON-LD escapes script-breaking characters and uses canonical URL", () => {
    pathname = "/en/assistance/arriving-by-ferry/";
    const { container } = renderWithProviders(<AssistanceFaqJsonLd ns="arrivingByFerry" />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).toContain("\\u003c");
    expect(script?.innerHTML).not.toContain("</script>");
    const json = getJsonLd(container);
    expect(json.url).toBe(`${BASE_URL}/en/assistance/arriving-by-ferry`);
  });

  it("guide FAQ JSON-LD uses canonical URL for the guide page", () => {
    pathname = "/en/experiences/ferry-schedules/";
    const { container } = renderWithProviders(<GuideFaqJsonLd guideKey="ferrySchedules" />);
    const json = getJsonLd(container);
    expect(json.url).toBe(`${BASE_URL}/en/experiences/ferry-schedules`);
  });

  it("deals JSON-LD uses localized deals URL", () => {
    pathname = "/en/deals";
    const { container } = renderWithProviders(<DealsStructuredData />);
    const json = getJsonLd(container);
    const itemList = json["itemListElement"] as Array<Record<string, unknown>>;
    const item = itemList?.[0]?.item as Record<string, unknown>;
    const dealsSlug = getSlug("deals", "en");
    expect(item?.url).toBe(`${BASE_URL}/en/${dealsSlug}`);
  });
});
