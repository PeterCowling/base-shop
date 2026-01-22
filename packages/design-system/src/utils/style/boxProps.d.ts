import * as React from "react";

export interface BoxOptions {
    width?: string | number;
    height?: string | number;
    padding?: string;
    margin?: string;
}
export declare function boxProps({ width, height, padding, margin }: BoxOptions): {
    classes: string;
    style: React.CSSProperties;
};
