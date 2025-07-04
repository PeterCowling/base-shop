/// <reference types="react" />
export type Review = {
    nameKey: string;
    quoteKey: string;
};
export default function ReviewsCarousel({ reviews, }: {
    reviews?: Review[];
}): import("react").JSX.Element;
