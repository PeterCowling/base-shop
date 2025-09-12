import editorRegistry from "../editorRegistry";

const expectedKeys = [
  "ContactForm",
  "Gallery",
  "Image",
  "Lookbook",
  "Testimonials",
  "PricingTable",
  "HeroBanner",
  "AnnouncementBar",
  "NewsletterSignup",
  "SearchBar",
  "ImageSlider",
  "CollectionList",
  "RecommendationCarousel",
  "ProductComparison",
  "ProductBundle",
  "GiftCardBlock",
  "FormBuilderBlock",
  "PopupModal",
  "ValueProps",
  "ReviewsCarousel",
  "SocialFeed",
  "SocialProof",
  "MapBlock",
  "StoreLocatorBlock",
  "VideoBlock",
  "FAQBlock",
  "Header",
  "Footer",
  "ProductFilter",
  "CountdownTimer",
  "SocialLinks",
  "Button",
  "Tabs",
  "ProductGrid",
  "ProductCarousel",
  "CustomHtml",
];

describe("editorRegistry", () => {
  it("maps expected keys to lazy components", () => {
    expectedKeys.forEach((key) => {
      const comp = (editorRegistry as Record<string, any>)[key];
      expect(comp).toBeDefined();
      expect(comp).toHaveProperty("$$typeof", Symbol.for("react.lazy"));
      expect(typeof (comp as any)._init).toBe("function");
    });
  });

  it("resolves Button editor module", async () => {
    const button = editorRegistry.Button as unknown as {
      _init: (payload: unknown) => unknown;
      _payload: unknown;
    };

    let resolved;
    try {
      resolved = button._init(button._payload);
    } catch (promise) {
      await promise;
      resolved = button._init(button._payload);
    }

    expect(resolved).toBeDefined();
  });
});

