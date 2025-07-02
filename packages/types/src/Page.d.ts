export type PageStatus = "draft" | "published";
export interface SeoMeta {
  title: string;
  description?: string;
  image?: string;
}
export interface PageComponentBase {
  id: string;
  type: string;
  [key: string]: unknown;
}
export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
}
export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
}
export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
}
export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
}
export interface GalleryComponent extends PageComponentBase {
  type: "Gallery";
  images?: {
    src: string;
    alt?: string;
  }[];
}
export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
}
export interface TestimonialsComponent extends PageComponentBase {
  type: "Testimonials";
  testimonials?: {
    quote: string;
    name?: string;
  }[];
}
export type PageComponent =
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | GalleryComponent
  | ContactFormComponent
  | TestimonialsComponent;
export interface Page {
  id: string;
  slug: string;
  status: PageStatus;
  components: PageComponent[];
  seo: SeoMeta;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
//# sourceMappingURL=Page.d.ts.map
