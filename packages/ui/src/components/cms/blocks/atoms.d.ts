import type { Locale } from "@/i18n/locales";
import React, { type ComponentPropsWithoutRef, type JSXElementConstructor } from "react";
/** Narrow `keyof JSX.IntrinsicElements` to *string‐only* keys (strips `number`). */
type IntrinsicTag = keyof JSX.IntrinsicElements & string;
/** Everything React can legally mount: intrinsic tag *or* React component. */
export type ValidComponent = IntrinsicTag | JSXElementConstructor<any>;
interface TextOwnProps {
    /** Plain string or locale-keyed map */
    text?: string | Record<Locale, string>;
    /** Element/component wrapper (defaults to “p”) */
    tag?: ValidComponent;
    /** Active locale used when `text` is a map */
    locale?: Locale;
}
export type TextProps<C extends ValidComponent = "p"> = TextOwnProps & Omit<ComponentPropsWithoutRef<C>, keyof TextOwnProps | "children" | "ref">;
export declare function Text<C extends ValidComponent = "p">({ text, tag, locale, ...rest }: TextProps<C>): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}
export declare const Image: React.NamedExoticComponent<ImageProps>;
export declare const atomRegistry: {
    readonly Text: typeof Text;
    readonly Image: React.NamedExoticComponent<ImageProps>;
};
export type AtomBlockType = keyof typeof atomRegistry;
export {};
//# sourceMappingURL=atoms.d.ts.map