/// <reference types="react" />
export type SliderTestimonial = {
    quote: string;
    name?: string;
};
export default function TestimonialSlider({ testimonials, }: {
    testimonials?: SliderTestimonial[];
}): import("react").JSX.Element;
