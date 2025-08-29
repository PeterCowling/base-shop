// src/atoms/index.tsx
import type { Locale } from "@acme/i18n/locales";
import React, {
  createElement,
  memo,
  type ComponentPropsWithoutRef,
  type JSXElementConstructor,
  type JSX as ReactJSX,
} from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";
import type { BlockRegistryEntry } from "./types";
import Divider from "./Divider";
import Spacer from "./Spacer";
import CustomHtml from "./CustomHtml";
import ButtonBlock from "./Button";
export { Divider, Spacer, CustomHtml, ButtonBlock as Button };

const defaultPreview = "/window.svg";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared helpers
 * --------------------------------------------------------------------------*/
/** Narrow `keyof JSX.IntrinsicElements` to *string‐only* keys (strips `number`). */
type IntrinsicTag = keyof ReactJSX.IntrinsicElements & string;

/** Everything React can legally mount: intrinsic tag *or* React component. */
export type ValidComponent = IntrinsicTag | JSXElementConstructor<unknown>;

/* ──────────────────────────────────────────────────────────────────────────
 * <Text>
 * --------------------------------------------------------------------------*/
interface TextOwnProps {
  /** Plain string or locale-keyed map */
  text?: string | Record<Locale, string>;
  /** Element/component wrapper (defaults to “p”) */
  tag?: ValidComponent;
  /** Active locale used when `text` is a map */
  locale?: Locale;
}

export type TextProps<C extends React.ElementType = "p"> = TextOwnProps &
  Omit<ComponentPropsWithoutRef<C>, keyof TextOwnProps | "children" | "ref">;

export function Text<C extends React.ElementType = "p">({
  text,
  tag = "p",
  locale = "en",
  ...rest
}: TextProps<C>) {
  const value = typeof text === "string" ? text : (text?.[locale] ?? "");

  /* `tag as ValidComponent` erases any possible `undefined` and guarantees the
     argument fits the overload `(type: string | FunctionComponent | ComponentClass)` */
  return createElement(
    tag as ValidComponent,
    rest as ComponentPropsWithoutRef<C>,
    value,
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * <Image>
 * --------------------------------------------------------------------------*/
export interface ImageProps
  extends Omit<NextImageProps, "src" | "alt" | "width" | "height"> {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export const Image = memo(function Image({
  src,
  alt = "",
  width,
  height,
  ...rest
}: ImageProps) {
  if (!src) return null;
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width ?? 0}
      height={height ?? 0}
      {...rest}
    />
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * Atom registry
 * --------------------------------------------------------------------------*/
const atomEntries = {
  Text: { component: Text, previewImage: "/file.svg" },
  Image: { component: Image, previewImage: "/globe.svg" },
  Divider: { component: Divider },
  Spacer: { component: Spacer },
  CustomHtml: { component: CustomHtml },
  Button: { component: ButtonBlock },
} as const;

type AtomRegistry = {
  -readonly [K in keyof typeof atomEntries]: BlockRegistryEntry<unknown>;
};

export const atomRegistry: AtomRegistry = Object.entries(atomEntries).reduce(
  (acc, [k, v]) => {
    acc[k as keyof typeof atomEntries] = {
      previewImage: defaultPreview,
      ...v,
    } as BlockRegistryEntry<unknown>;
    return acc;
  },
  {} as AtomRegistry,
);

export type AtomBlockType = keyof typeof atomEntries;
