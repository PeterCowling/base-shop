/// <reference types="react" />
export type Testimonial = {
    quote: string;
    name?: string;
};
export default function Testimonials({ testimonials, }: {
    testimonials?: Testimonial[];
}): import("react").JSX.Element;
