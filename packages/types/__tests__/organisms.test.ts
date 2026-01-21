import {
  blogListingComponentSchema,
  contactFormWithMapComponentSchema,
  galleryComponentSchema,
  giftCardBlockComponentSchema,
  heroBannerComponentSchema,
  imageSliderComponentSchema,
  lookbookComponentSchema,
  popupModalComponentSchema,
  pricingTableComponentSchema,
  productCarouselComponentSchema,
  productGridComponentSchema,
  recommendationCarouselComponentSchema,
  storeLocatorBlockComponentSchema,
  testimonialsComponentSchema,
  testimonialSliderComponentSchema,
} from "../src/page/organisms";

describe("organisms schemas", () => {
  const cases: [any, any][] = [
    [heroBannerComponentSchema, { id: "h1", type: "HeroBanner" }],
    [productGridComponentSchema, { id: "pg1", type: "ProductGrid" }],
    [productCarouselComponentSchema, { id: "pc1", type: "ProductCarousel" }],
    [recommendationCarouselComponentSchema, { id: "rc1", type: "RecommendationCarousel", endpoint: "/api" }],
    [galleryComponentSchema, { id: "g1", type: "Gallery" }],
    [lookbookComponentSchema, { id: "l1", type: "Lookbook" }],
    [imageSliderComponentSchema, { id: "is1", type: "ImageSlider" }],
    [contactFormWithMapComponentSchema, { id: "cfm1", type: "ContactFormWithMap" }],
    [storeLocatorBlockComponentSchema, { id: "sl1", type: "StoreLocatorBlock" }],
    [blogListingComponentSchema, { id: "bl1", type: "BlogListing" }],
    [testimonialsComponentSchema, { id: "tm1", type: "Testimonials" }],
    [pricingTableComponentSchema, { id: "pt1", type: "PricingTable" }],
    [testimonialSliderComponentSchema, { id: "ts1", type: "TestimonialSlider" }],
    [giftCardBlockComponentSchema, { id: "gc1", type: "GiftCardBlock" }],
    [popupModalComponentSchema, { id: "pm1", type: "PopupModal" }],
  ];

  it.each(cases)("parses %p", (schema, data) => {
    expect(schema.parse(data)).toEqual(data);
  });

  it("requires endpoint for recommendation carousel", () => {
    expect(
      recommendationCarouselComponentSchema.safeParse({ id: "bad", type: "RecommendationCarousel" } as any)
        .success
    ).toBe(false);
  });
});

