import * as React from "react";
export interface Image360ViewerProps extends React.HTMLAttributes<HTMLDivElement> {
    frames: string[];
    alt?: string;
}
export declare const Image360Viewer: React.ForwardRefExoticComponent<Image360ViewerProps & React.RefAttributes<HTMLDivElement>>;
