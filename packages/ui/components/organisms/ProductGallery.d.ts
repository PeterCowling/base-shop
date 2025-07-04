import * as React from "react";
import { MediaItem } from "../molecules/MediaSelector";
export interface ProductGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
    media: MediaItem[];
}
export declare function ProductGallery({ media, className, ...props }: ProductGalleryProps): React.JSX.Element;
