import { render } from "@testing-library/react";

import { renderArticleLead } from "../../../../routes/how-to-get-here/chiesaNuovaArrivals/articleLead";
import type { GuideExtras } from "../../../../routes/how-to-get-here/chiesaNuovaArrivals/types";

// createGuideLabelReader uses guide-specific i18n — mock so it returns null (triggers fallback labels)
jest.mock("../../../../routes/how-to-get-here/chiesaNuovaArrivals/labels", () => ({
  createGuideLabelReader: () => () => null,
}));

// guideHref is only called in the knees section; our extras have no knees, but mock anyway
// to avoid any import-time side effects from @/routes.guides-helpers
jest.mock("@/routes.guides-helpers", () => ({ guideHref: () => "#" }));

const BASE_URL =
  "https://www.google.com/maps/embed/v1/directions?origin=Chiesa+Nuova&destination=Hostel+Brikette&mode=walking";

const extras: GuideExtras = {
  intro: [],
  image: undefined,
  sections: [],
  beforeList: [],
  stepsList: ["Walk to the bus stop"],
  stepsMapEmbedUrl: BASE_URL,
  kneesList: [],
  faqs: [],
  faqsTitle: "",
  tocTitle: "On This Page",
  tocItems: [],
  howToSteps: [],
  labels: {
    onThisPage: "On This Page",
    before: "Before",
    steps: "Steps",
    knees: "Knees",
    faqs: "FAQs",
  },
};

// Only lang, renderGenericContent, and sections are accessed by renderArticleLead
const context = {
  lang: "en",
  renderGenericContent: false,
  sections: [],
} as any;

describe("TASK-05: articleLead.tsx map key injection (TC-01, TC-02)", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  });

  it("TC-01: appends &key= to stepsMapEmbedUrl when NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is set", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "test-key";
    const { container } = render(renderArticleLead(context, extras));
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe(`${BASE_URL}&key=test-key`);
  });

  it("TC-02: uses base stepsMapEmbedUrl unmodified when key is not set; no key= param in src", () => {
    // env var not set
    const { container } = render(renderArticleLead(context, extras));
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe(BASE_URL);
    expect(iframe!.getAttribute("src")).not.toContain("key=");
  });
});
