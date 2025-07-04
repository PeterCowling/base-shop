import * as React from "react";
export interface ARViewerProps extends React.HTMLAttributes<HTMLElement> {
    src: string;
}
export declare function ARViewer({ src, className, ...props }: ARViewerProps): React.JSX.Element;
