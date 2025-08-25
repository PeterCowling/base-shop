import { z } from "zod";
import { type PageComponentBase } from "../base";
export interface TextComponent extends PageComponentBase {
    type: "Text";
    text?: string;
}
export declare const textComponentSchema: z.ZodObject<{
    id: z.ZodString;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"Text">;
    text: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"Text">;
    text: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"Text">;
    text: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=Text.d.ts.map