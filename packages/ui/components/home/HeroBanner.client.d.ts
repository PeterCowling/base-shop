/// <reference types="react" />
export type Slide = {
    src: string;
    alt: string;
    headlineKey: string;
    ctaKey: string;
};
export default function HeroBanner({ slides, }: {
    slides?: Slide[];
}): import("react").JSX.Element;
