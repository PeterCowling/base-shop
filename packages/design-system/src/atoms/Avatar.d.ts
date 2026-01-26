import * as React from "react";
import { type ImageProps } from "next/image";

export interface AvatarProps extends Omit<ImageProps, "width" | "height"> {
    /** Content to display when no image src is provided */
    fallback?: React.ReactNode;
    /** Both width and height of the avatar in pixels */
    size?: number;
    /** Optional explicit width (must be numeric for Next Image) */
    width?: number | `${number}`;
    /** Optional explicit height (must be numeric for Next Image) */
    height?: number | `${number}`;
    /** Optional padding classes */
    padding?: string;
    /** Optional margin classes */
    margin?: string;
}
export declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLImageElement>>;
//# sourceMappingURL=Avatar.d.ts.map