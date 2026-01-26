import * as React from "react";

export interface ColorSwatchProps extends React.HTMLAttributes<HTMLButtonElement> {
    color: string;
    selected?: boolean;
    /**
     * Width/height of the swatch in pixels. Defaults to 24.
     */
    size?: number;
}
/**
 * Simple circular swatch button for color selection.
 */
export declare const ColorSwatch: React.ForwardRefExoticComponent<ColorSwatchProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=ColorSwatch.d.ts.map