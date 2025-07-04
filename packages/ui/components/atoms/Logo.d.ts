import { type ImageProps } from "next/image";
import * as React from "react";
export interface LogoProps extends ImageProps {
    textFallback?: string;
}
export declare const Logo: React.ForwardRefExoticComponent<LogoProps & React.RefAttributes<HTMLImageElement>>;
