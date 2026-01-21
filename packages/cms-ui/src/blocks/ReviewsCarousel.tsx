import ReviewsCarousel, { type Review } from "../../home/ReviewsCarousel";

interface Props {
  reviews?: Review[];
  minItems?: number;
  maxItems?: number;
}

export default function CmsReviewsCarousel({
  reviews = [],
  minItems,
  maxItems,
}: Props) {
  const list = reviews.slice(0, maxItems ?? reviews.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  return <ReviewsCarousel reviews={list} />;
}
