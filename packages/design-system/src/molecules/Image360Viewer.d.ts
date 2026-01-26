import * as React from "react";

export interface Image360ViewerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Ordered frame URLs forming the 360-degree sequence */
    frames: string[];
    /** Alternate text for accessibility */
    alt?: string;
}
export declare const Image360Viewer: React.ForwardRefExoticComponent<Image360ViewerProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Image360Viewer.d.ts.map