import * as React from "react";
/**
 * Fly-out mini cart that shows current cart contents.
 * Trigger element is provided via `trigger` prop.
 */
export interface MiniCartProps {
    trigger: React.ReactNode;
    /**
     * Optional width for the drawer. Accepts a Tailwind width class
     * (e.g. "w-80") or a numeric pixel value.
     */
    width?: string | number;
}
export declare function MiniCart({ trigger, width }: MiniCartProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MiniCart.client.d.ts.map