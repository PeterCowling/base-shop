export type ImageSlide = {
    src: string;
    alt?: string;
    caption?: string;
};
interface Props {
    slides?: ImageSlide[];
    minItems?: number;
    maxItems?: number;
}
export default function ImageSlider({ slides, minItems, maxItems, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ImageSlider.d.ts.map