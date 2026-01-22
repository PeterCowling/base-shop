// src/atoms/index.tsx
import React, {
  type ComponentPropsWithoutRef,
  createElement,
  type JSX as ReactJSX,
  type JSXElementConstructor,
  memo,
} from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";

import type { Locale } from "@acme/i18n/locales";

import ButtonBlock from "./Button";
import CustomHtml from "./CustomHtml";
import Divider from "./Divider";
import Spacer from "./Spacer";
import type { BlockRegistryEntry } from "./types";

export { ButtonBlock as Button,CustomHtml, Divider, Spacer };

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
  /** Aspect ratio preset like "1:1", "4:3", "16:9" */
  cropAspect?: string;
  /** Focal point within the image (0..1 coordinates) */
  focalPoint?: { x: number; y: number };
}

export const Image = memo(function Image({
  src,
  alt = "",
  width,
  height,
  cropAspect,
  focalPoint,
  ...rest
}: ImageProps) {
  if (!src) return null;
  const style: React.CSSProperties | undefined = focalPoint
    ? ({ objectPosition: `${(focalPoint.x * 100).toFixed(2)}% ${(focalPoint.y * 100).toFixed(2)}%` } as React.CSSProperties)
    : undefined;

  // If an aspect ratio is provided, render a responsive wrapper and use fill
  if (cropAspect) {
    const [w, h] = cropAspect.split(":");
    const numeric = Number(w) > 0 && Number(h) > 0 ? `${Number(w) / Number(h)}` : undefined;
    return (
      <div
        className="relative w-full overflow-hidden"
         
        style={numeric ? ({ aspectRatio: numeric } as React.CSSProperties) : undefined}
      >
        <NextImage
          src={src}
          alt={alt}
          fill
          style={style}
          className="object-cover"
          {...rest}
        />
      </div>
    );
  }

  // No aspect ratio → use width/height as provided
  return <NextImage src={src} alt={alt} width={width ?? 0} height={height ?? 0} style={style} {...rest} />;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DS/CMS typing needs generic registry values (tracked in ABC-123)
} satisfies Record<string, BlockRegistryEntry<any>>;

type AtomRegistry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry aggregates heterogeneous block prop types (ABC-123)
  -readonly [K in keyof typeof atomEntries]: BlockRegistryEntry<any>;
};

export const atomRegistry: AtomRegistry = Object.entries(atomEntries).reduce(
  (acc, [k, v]) => {
    acc[k as keyof typeof atomEntries] = {
      previewImage: defaultPreview,
      ...v,
    };
    return acc;
  },
  {} as AtomRegistry,
);

export type AtomBlockType = keyof typeof atomEntries;
