export interface StyleOverrides {
    color?: {
        fg?: string;
        bg?: string;
        border?: string;
    };
    typography?: {
        fontFamily?: string;
        fontSize?: string;
        fontWeight?: string;
        lineHeight?: string;
    };
    /** Optional per-breakpoint overrides used by the builder stylesheet */
    typographyDesktop?: {
        fontSize?: string;
        lineHeight?: string;
    };
    typographyTablet?: {
        fontSize?: string;
        lineHeight?: string;
    };
    typographyMobile?: {
        fontSize?: string;
        lineHeight?: string;
    };
    /**
     * Visual effects and fine-grained styling applied per-block.
     * Values accept raw CSS (e.g., "8px", "0.8", "1rem 1rem 2rem rgba(0,0,0,.2)")
     * or token references (e.g., "var(--radius-lg)").
     */
    effects?: {
        /** Corner radius */
        borderRadius?: string;
        /** Box shadow string */
        boxShadow?: string;
        /** Opacity 0..1 */
        opacity?: string;
        /** Backdrop filter (e.g., blur(8px) saturate(.8)) */
        backdropFilter?: string;
        /** Foreground filter (e.g., brightness(1) contrast(1.2) saturate(1) blur(2px)) */
        filter?: string;
        /** Outline shorthand */
        outline?: string;
        /** Outline offset length */
        outlineOffset?: string;
        /** Per-side border shorthands */
        borderTop?: string;
        borderRight?: string;
        borderBottom?: string;
        borderLeft?: string;
        /**
         * Optional transform parts that will be composed in order.
         * Use CSS units (e.g., rotate: "15deg", scale: "1.05").
         */
        transformRotate?: string;
        transformScale?: string;
        transformSkewX?: string;
        transformSkewY?: string;
    };
}
//# sourceMappingURL=StyleOverrides.d.ts.map