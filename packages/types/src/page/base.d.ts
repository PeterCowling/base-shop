import { z } from "zod";
import type { Translated } from "../Product";
export type PageStatus = "draft" | "published";
export interface SeoMeta {
    title: Translated;
    description?: Translated;
    image?: Translated;
}
export interface PageComponentBase {
    id: string;
    type: string;
    /**
     * Width of the rendered component. Supports any CSS length including
     * pixel values (e.g. "300px"), percentages (e.g. "50%"), or viewport
     * units (e.g. "30vw").
     */
    width?: string;
    /**
     * Width of the component on desktop viewports. Overrides `width` when
     * rendering on large screens.
     */
    widthDesktop?: string;
    /**
     * Width of the component on tablet viewports. Overrides `width` on medium
     * screens.
     */
    widthTablet?: string;
    /**
     * Width of the component on mobile viewports. Overrides `width` on small
     * screens.
     */
    widthMobile?: string;
    /**
     * Height of the rendered component. Supports any CSS length such as
     * pixels, percentages or viewport units.
     */
    height?: string;
    /**
     * Height of the component on desktop viewports. Overrides `height` when
     * rendering on large screens.
     */
    heightDesktop?: string;
    /**
     * Height of the component on tablet viewports. Overrides `height` on medium
     * screens.
     */
    heightTablet?: string;
    /**
     * Height of the component on mobile viewports. Overrides `height` on small
     * screens.
     */
    heightMobile?: string;
    /**
     * CSS position property used when rendering the component.
     */
    position?: "relative" | "absolute";
    /**
     * Offset from the top when position is absolute. Accepts any CSS length
     * including pixels, percentages or viewport units.
     */
    top?: string;
    /**
     * Offset from the left when position is absolute. Accepts any CSS length
     * including pixels, percentages or viewport units.
     */
    left?: string;
    /**
     * Margin applied to the outer container when rendered.
     * Accepts any valid CSS margin value or Tailwind class.
     */
    margin?: string;
    /** Margin on desktop viewports. Overrides `margin` on large screens. */
    marginDesktop?: string;
    /** Margin on tablet viewports. Overrides `margin` on medium screens. */
    marginTablet?: string;
    /** Margin on mobile viewports. Overrides `margin` on small screens. */
    marginMobile?: string;
    /**
     * Padding applied to the outer container when rendered.
     * Accepts any valid CSS padding value or Tailwind class.
     */
    padding?: string;
    /** Padding on desktop viewports. Overrides `padding` on large screens. */
    paddingDesktop?: string;
    /** Padding on tablet viewports. Overrides `padding` on medium screens. */
    paddingTablet?: string;
    /** Padding on mobile viewports. Overrides `padding` on small screens. */
    paddingMobile?: string;
    /** Minimum number of items allowed for components with lists */
    minItems?: number;
    /** Maximum number of items allowed for components with lists */
    maxItems?: number;
    /** Explicit item counts for large screens */
    desktopItems?: number;
    /** Explicit item counts for medium screens */
    tabletItems?: number;
    /** Explicit item counts for small screens */
    mobileItems?: number;
    /** Action performed when component is clicked */
    clickAction?: "none" | "navigate";
    /** Destination when using a navigation click action */
    href?: string;
    /** Simple animation applied on render */
    animation?: "none" | "fade" | "slide";
    [key: string]: unknown;
}
export declare const baseComponentSchema: z.ZodObject<{
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
}, z.ZodTypeAny, "passthrough">>;
