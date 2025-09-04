import * as React from "react";
export interface ImageCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    images: { src: string; alt?: string }[];
}
export declare function ImageCarousel({ images, className, ...props }: ImageCarouselProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=ImageCarousel.d.ts.map
