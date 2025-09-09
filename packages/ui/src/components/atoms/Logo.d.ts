import { type ImageProps } from "next/image";
import * as React from "react";
export interface LogoProps extends ImageProps {
    /** Name of the shop for alt text or fallback */
    shopName: string;
}
export declare const Logo: React.ForwardRefExoticComponent<LogoProps & React.RefAttributes<HTMLImageElement>>;
//# sourceMappingURL=Logo.d.ts.map