import { type ImageProps } from "next/image";
import * as React from "react";
export interface ZoomImageProps extends ImageProps {
    zoomScale?: number;
}
export declare const ZoomImage: React.ForwardRefExoticComponent<ZoomImageProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ZoomImage.d.ts.map