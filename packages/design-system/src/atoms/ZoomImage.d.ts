import * as React from "react";
import { type ImageProps } from "next/image";

export interface ZoomImageProps extends ImageProps {
    zoomScale?: number;
}
export declare const ZoomImage: React.ForwardRefExoticComponent<ZoomImageProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ZoomImage.d.ts.map