import type { Locale } from "@acme/i18n/locales";
import React, { type ComponentPropsWithoutRef, type JSXElementConstructor, type JSX as ReactJSX } from "react";
import type { BlockRegistryEntry } from "./types";
import Divider from "./Divider";
import Spacer from "./Spacer";
import CustomHtml from "./CustomHtml";
import ButtonBlock from "./Button";
export { Divider, Spacer, CustomHtml, ButtonBlock as Button };
/** Narrow `keyof JSX.IntrinsicElements` to *string‐only* keys (strips `number`). */
type IntrinsicTag = keyof ReactJSX.IntrinsicElements & string;
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
export type TextProps<C extends React.ElementType = "p"> = TextOwnProps & Omit<ComponentPropsWithoutRef<C>, keyof TextOwnProps | "children" | "ref">;
export declare function Text<C extends React.ElementType = "p">({ text, tag, locale, ...rest }: TextProps<C>): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}
export declare const Image: React.NamedExoticComponent<ImageProps>;
declare const atomEntries: {
    readonly Text: {
        readonly component: typeof Text;
        readonly previewImage: "/file.svg";
    };
    readonly Image: {
        readonly component: React.NamedExoticComponent<ImageProps>;
        readonly previewImage: "/globe.svg";
    };
    readonly Divider: {
        readonly component: typeof Divider;
    };
    readonly Spacer: {
        readonly component: typeof Spacer;
    };
    readonly CustomHtml: {
        readonly component: React.MemoExoticComponent<({ html }: import("./CustomHtml").CustomHtmlProps) => import("react/jsx-runtime").JSX.Element | null>;
    };
    readonly Button: {
        readonly component: typeof ButtonBlock;
    };
};
type AtomRegistry = {
    -readonly [K in keyof typeof atomEntries]: BlockRegistryEntry<any>;
};
export declare const atomRegistry: AtomRegistry;
export type AtomBlockType = keyof typeof atomEntries;
//# sourceMappingURL=atoms.d.ts.map