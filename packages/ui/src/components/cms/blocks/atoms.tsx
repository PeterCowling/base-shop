// src/atoms/index.tsx
import type { Locale } from "@/i18n/locales";
import React, {
  createElement,
  memo,
  type ComponentPropsWithoutRef,
  type JSXElementConstructor,
  type JSX as ReactJSX,
} from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared helpers
 * --------------------------------------------------------------------------*/
/** Narrow `keyof JSX.IntrinsicElements` to *string‐only* keys (strips `number`). */
type IntrinsicTag = keyof ReactJSX.IntrinsicElements & string;

/** Everything React can legally mount: intrinsic tag *or* React component. */
export type ValidComponent = IntrinsicTag | JSXElementConstructor<any>;

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
  return createElement(tag as ValidComponent, rest as any, value);
}

/* ──────────────────────────────────────────────────────────────────────────
 * <Image>
 * --------------------------------------------------------------------------*/
export interface ImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "alt" | "width" | "height"
  > {
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
  return <img src={src} alt={alt} width={width} height={height} {...rest} />;
});

/* ──────────────────────────────────────────────────────────────────────────
 * Atom registry
 * --------------------------------------------------------------------------*/
export const atomRegistry = {
  Text,
  Image,
} as const;

export type AtomBlockType = keyof typeof atomRegistry;
