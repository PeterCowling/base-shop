import {
  announcementBarComponentSchema,
  contactFormComponentSchema,
  countdownTimerComponentSchema,
  faqBlockComponentSchema,
  mapBlockComponentSchema,
  newsletterSignupComponentSchema,
  reviewsCarouselComponentSchema,
  searchBarComponentSchema,
  socialFeedComponentSchema,
  socialLinksComponentSchema,
  socialProofComponentSchema,
  valuePropsComponentSchema,
  videoBlockComponentSchema,
} from "../src/page/molecules";

describe("molecules schemas", () => {
  const cases: [any, any][] = [
    [announcementBarComponentSchema, { id: "a1", type: "AnnouncementBar" }],
    [valuePropsComponentSchema, { id: "v1", type: "ValueProps", items: [{ icon: "i", title: "t", desc: "d" }] }],
    [reviewsCarouselComponentSchema, { id: "r1", type: "ReviewsCarousel", reviews: [{ nameKey: "n", quoteKey: "q" }] }],
    [contactFormComponentSchema, { id: "c1", type: "ContactForm" }],
    [newsletterSignupComponentSchema, { id: "n1", type: "NewsletterSignup" }],
    [searchBarComponentSchema, { id: "s1", type: "SearchBar" }],
    [mapBlockComponentSchema, { id: "m1", type: "MapBlock" }],
    [videoBlockComponentSchema, { id: "v2", type: "VideoBlock" }],
    [faqBlockComponentSchema, { id: "f1", type: "FAQBlock" }],
    [countdownTimerComponentSchema, { id: "c2", type: "CountdownTimer" }],
    [socialLinksComponentSchema, { id: "sl1", type: "SocialLinks" }],
    [socialFeedComponentSchema, { id: "sf1", type: "SocialFeed" }],
    [socialProofComponentSchema, { id: "sp1", type: "SocialProof" }],
  ];

  it.each(cases)("parses %p", (schema, data) => {
    expect(schema.parse(data)).toEqual(data);
  });

  it("rejects invalid social feed platform", () => {
    expect(
      socialFeedComponentSchema.safeParse({ id: "bad", type: "SocialFeed", platform: "tiktok" } as any)
        .success
    ).toBe(false);
  });
});

