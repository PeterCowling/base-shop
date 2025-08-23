import * as React from "react";
export type MediaType = "image" | "video" | "360" | "model";
export interface MediaItem {
    type: MediaType;
    src: string;
    thumbnail?: string;
    alt?: string;
    frames?: string[];
}
export interface MediaSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    items: MediaItem[];
    active: number;
    onChange?: (idx: number) => void;
}
export declare function MediaSelector({ items, active, onChange, className, ...props }: MediaSelectorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MediaSelector.d.ts.map