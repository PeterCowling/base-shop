import * as React from "react";
import { type ImageProps } from "next/image";

type Viewport = "desktop" | "tablet" | "mobile";
interface LogoSource {
    src: ImageProps["src"];
    width?: number;
    height?: number;
}
export interface LogoProps extends Omit<ImageProps, "alt" | "src" | "width" | "height"> {
    /** Text to display when no image source is available */
    fallbackText: string;
    src?: ImageProps["src"];
    sources?: Partial<Record<Viewport, LogoSource>>;
    width?: number;
    height?: number;
    alt?: string;
}
export declare const Logo: React.ForwardRefExoticComponent<LogoProps & React.RefAttributes<HTMLImageElement>>;
//# sourceMappingURL=Logo.d.ts.map
