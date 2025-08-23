import * as React from "react";
export interface LiveChatWidgetProps extends React.HTMLAttributes<HTMLButtonElement> {
    /**
     * Width of the chat dialog. Provide a Tailwind width class
     * (e.g. "w-80") or a numeric pixel value.
     * @default "w-80"
     */
    width?: string | number;
    /**
     * Distance from the bottom of the viewport for both the
     * toggle button and the chat dialog. Accepts a Tailwind
     * class like "bottom-4" or a numeric pixel value.
     * @default "bottom-4"
     */
    bottomOffset?: string | number;
}
/**
 * Simple live chat widget with a toggle button and minimal conversation UI.
 */
export declare function LiveChatWidget({ className, width, bottomOffset, ...props }: LiveChatWidgetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LiveChatWidget.d.ts.map