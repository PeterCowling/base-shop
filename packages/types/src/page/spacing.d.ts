import { z } from "zod";

export interface SpacingProps {
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
}
export declare const spacingSchema: z.ZodObject<{
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    margin?: string | undefined;
    marginDesktop?: string | undefined;
    marginTablet?: string | undefined;
    marginMobile?: string | undefined;
    padding?: string | undefined;
    paddingDesktop?: string | undefined;
    paddingTablet?: string | undefined;
    paddingMobile?: string | undefined;
}, {
    margin?: string | undefined;
    marginDesktop?: string | undefined;
    marginTablet?: string | undefined;
    marginMobile?: string | undefined;
    padding?: string | undefined;
    paddingDesktop?: string | undefined;
    paddingTablet?: string | undefined;
    paddingMobile?: string | undefined;
}>;
//# sourceMappingURL=spacing.d.ts.map