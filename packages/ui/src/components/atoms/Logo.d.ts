import { type ImageProps } from "next/image";
import * as React from "react";

export interface LogoSource {
    srcSet: string;
    media?: string;
    type?: string;
}

export interface LogoProps extends Omit<ImageProps, "alt"> {
    fallbackText: string;
    sources?: LogoSource[];
    srcSet?: string;
    alt?: string;
}

export declare const Logo: React.ForwardRefExoticComponent<LogoProps & React.RefAttributes<HTMLImageElement>>;
