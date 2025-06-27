export type PageStatus = "draft" | "published";
export interface SeoMeta {
  title: string;
  description?: string;
}
export interface PageComponentBase {
  id: string;
  type: string;
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
export type PageComponent =
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent;
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
