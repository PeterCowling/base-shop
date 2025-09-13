import { Testimonial } from "./Testimonials";
interface RatingProps {
    rating: number;
    count?: number;
}
interface Props {
    /** URL returning an array of order events */
    source?: string;
    /** How often to rotate messages in ms */
    frequency?: number;
    rating?: RatingProps;
    testimonials?: Testimonial[];
}
export default function SocialProof({ source, frequency, rating, testimonials }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=SocialProof.d.ts.map

