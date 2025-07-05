export type SliderTestimonial = {
    quote: string;
    name?: string;
};
export default function TestimonialSlider({ testimonials, }: {
    testimonials?: SliderTestimonial[];
}): import("react/jsx-runtime").JSX.Element;
