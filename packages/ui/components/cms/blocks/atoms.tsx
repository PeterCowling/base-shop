import type { Locale } from "@/i18n/locales";
import type { ElementType } from "react";

export function Text({
  text = {},
  tag = "p",
  locale = "en",
}: {
  text?: string | Record<Locale, string>;
  tag?: keyof JSX.IntrinsicElements;
  locale?: Locale;
}) {
  const Comp = tag as ElementType;
  const value = typeof text === "string" ? text : (text?.[locale] ?? "");
  return <Comp>{value}</Comp>;
}

export function Image({
  src,
  alt = "",
  width,
  height,
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  if (!src) return null;
  return <img src={src} alt={alt} width={width} height={height} />;
}

export const atomRegistry = {
  Text,
  Image,
} as const;

export type AtomBlockType = keyof typeof atomRegistry;
