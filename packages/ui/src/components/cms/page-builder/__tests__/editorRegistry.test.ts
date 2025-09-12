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
    expect(Object.keys(editorRegistry)).toEqual(expectedKeys);

    expectedKeys.forEach((key) => {
      const comp = (editorRegistry as Record<string, any>)[key];
      expect(comp).toHaveProperty("$$typeof", Symbol.for("react.lazy"));
      expect(typeof (comp as any)._init).toBe("function");
    });
  });

  it("resolves all editor modules", async () => {
    const entries = Object.values(editorRegistry) as Array<{
      _init: (payload: unknown) => unknown;
      _payload: unknown;
    }>;

    await Promise.all(
      entries.map(async (editor) => {
        let resolved;

        try {
          resolved = editor._init(editor._payload);
        } catch (promise) {
          await promise;
          resolved = editor._init(editor._payload);
        }

        expect(resolved).toBeDefined();
      })
    );
  });
});

