export type Testimonial = {
    quote: string;
    name?: string;
};
export default function Testimonials({ testimonials, minItems, maxItems, }: {
    testimonials?: Testimonial[];
    minItems?: number;
    maxItems?: number;
}): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Testimonials.d.ts.map