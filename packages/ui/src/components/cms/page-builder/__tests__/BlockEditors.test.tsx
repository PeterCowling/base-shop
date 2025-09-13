import { fireEvent, render, screen } from "@testing-library/react";
import ContactFormEditor from "../ContactFormEditor";
import GalleryEditor from "../GalleryEditor";
import ImageBlockEditor from "../ImageBlockEditor";
import TestimonialsEditor from "../TestimonialsEditor";
import HeroBannerEditor from "../HeroBannerEditor";
import ValuePropsEditor from "../ValuePropsEditor";
import ReviewsCarouselEditor from "../ReviewsCarouselEditor";
import AnnouncementBarEditor from "../AnnouncementBarEditor";
import SocialFeedEditor from "../SocialFeedEditor";
import SocialProofEditor from "../SocialProofEditor";
import NewsletterSignupEditor from "../NewsletterSignupEditor";
import StoreLocatorBlockEditor from "../StoreLocatorBlockEditor";
import FeaturedProductEditor from "../FeaturedProductEditor";
import FormBuilderEditor from "../FormBuilderEditor";
import ProductBundleEditor from "../ProductBundleEditor";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

describe("block editors", () => {
  const cases: [string, React.ComponentType<any>, any, string][] = [
    [
      "ContactFormEditor",
      ContactFormEditor,
      { type: "ContactForm", action: "", method: "" },
      "action",
    ],
    [
      "ImageBlockEditor",
      ImageBlockEditor,
      { type: "Image", src: "", alt: "" },
      // Image editor placeholders use translation keys
      "cms.image.alt",
    ],
    [
      "GalleryEditor",
      GalleryEditor,
      { type: "Gallery", images: [{ src: "", alt: "" }] },
      "src",
    ],
    [
      "TestimonialsEditor",
      TestimonialsEditor,
      { type: "Testimonials", testimonials: [{ quote: "", name: "" }] },
      "quote",
    ],
    [
      "HeroBannerEditor",
      HeroBannerEditor,
      {
        type: "HeroBanner",
        slides: [{ src: "", alt: "", headlineKey: "", ctaKey: "" }],
      },
      "src",
    ],
    [
      "ValuePropsEditor",
      ValuePropsEditor,
      { type: "ValueProps", items: [{ icon: "", title: "", desc: "" }] },
      "icon",
    ],
    [
      "ReviewsCarouselEditor",
      ReviewsCarouselEditor,
      { type: "ReviewsCarousel", reviews: [{ nameKey: "", quoteKey: "" }] },
      "nameKey",
    ],
    [
      "AnnouncementBarEditor",
      AnnouncementBarEditor,
      { type: "AnnouncementBar", text: "", link: "" },
      "text",
    ],
    [
      "NewsletterSignupEditor",
      NewsletterSignupEditor,
      { type: "NewsletterSignup", action: "" },
      "action",
    ],
    [
      "SocialFeedEditor",
      SocialFeedEditor,
      { type: "SocialFeed", platform: "twitter", account: "" },
      "account",
    ],
    [
      "SocialProofEditor",
      SocialProofEditor,
      { type: "SocialProof", source: "" },
      "data source URL",
    ],
    [
      "StoreLocatorBlockEditor",
      StoreLocatorBlockEditor,
      { type: "StoreLocatorBlock", locations: [{ lat: "", lng: "", label: "" }] },
      "lat",
    ],
    [
      "FeaturedProductEditor",
      FeaturedProductEditor,
      { type: "FeaturedProduct", sku: "" },
      "sku",
    ],
    [
      "ProductBundleEditor",
      ProductBundleEditor,
      { type: "ProductBundle", skus: [] },
      "skus",
    ],
    [
      "FormBuilderEditor",
      FormBuilderEditor,
      { type: "FormBuilderBlock", fields: [{ type: "text", name: "" }] },
      "name",
    ],
  ];

  it.each(cases)("%s triggers onChange", (_name, Comp, component, placeholder) => {
    const onChange = jest.fn();
    render(<Comp component={component} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(placeholder), {
      target: { value: "x" },
    });
    expect(onChange).toHaveBeenCalled();
  });
});
