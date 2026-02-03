// src/components/guides/generic-content/types.ts
import type { Namespace, TFunction } from "i18next";

export type GenericContentTranslator = TFunction<Namespace, unknown>;

export type SectionImage = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type Section = {
  id: string;
  title: string;
  body?: string[];
  images?: SectionImage[];
};

export type FAQ = {
  q: string;
  a: string | string[];
};

export type TocItem = {
  href: string;
  label: string;
  key?: string;
};

export type TocOverrides = {
  title?: string;
  labels: Map<string, string>;
};

export type ListSectionConfig = {
  id: string;
  title: string;
  items: string[];
};

export type ResolvedSection = {
  key: string;
  id: string;
  title: string;
  label: string;
  body: string[];
  images?: SectionImage[];
  /**
   * When false, the section should not be included in the derived Table of
   * Contents. Used to suppress entries for legacy sections that lacked a
   * stable identifier (e.g., id: null) while still allowing the section to
   * render in the article body.
   */
  includeInToc?: boolean;
};

export type SupplementalNavEntry = {
  id: string;
  label: string;
};
