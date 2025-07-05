import ReviewsCarousel, { type Review } from "../../home/ReviewsCarousel";

export default function CmsReviewsCarousel(props: { reviews?: Review[] }) {
  return <ReviewsCarousel {...props} />;
}
