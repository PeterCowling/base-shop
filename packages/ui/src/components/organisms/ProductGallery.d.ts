import * as React from "react";
import { MediaItem } from "../molecules/MediaSelector";
export interface ProductGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Ordered media items shown in the gallery */
    media: MediaItem[];
}
export declare function ProductGallery({ media, className, ...props }: ProductGalleryProps): import("react/jsx-runtime").JSX.Element;
