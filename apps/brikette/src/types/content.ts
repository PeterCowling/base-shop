// src/types/content.ts
// Centralised content-type exports to reduce drift across the app.
// Surfaces readonly versions of frequently-used inferred Zod types.

import type {
  GalleryBinding as _GalleryBinding,
  GalleryBindingItem as _GalleryBindingItem,
  HowToGetHereRoutesLocale as _HowToGetHereRoutesLocale,
  LinkBinding as _LinkBinding,
  LinkListBinding as _LinkListBinding,
  LinkListBindingItem as _LinkListBindingItem,
  LinkTarget as _LinkTarget,
  MediaBinding as _MediaBinding,
  RouteContent as _RouteContent,
  RouteDefinitionDocument as _RouteDefinitionDocument,
  RouteDefinitionEntry as _RouteDefinitionEntry,
} from "@/lib/how-to-get-here/schema";

import type { GuidesNamespace as _GuidesNamespace } from "../locales/guides";

// Shallow readonly wrappers for common content types. Use where mutation should
// be discouraged at call-sites.
export type LinkTarget = Readonly<_LinkTarget>;
export type LinkBinding = Readonly<_LinkBinding>;
export type MediaBinding = Readonly<_MediaBinding>;
export type GalleryBindingItem = Readonly<_GalleryBindingItem>;
export type GalleryBinding = Readonly<_GalleryBinding>;
export type LinkListBindingItem = Readonly<_LinkListBindingItem>;
export type LinkListBinding = Readonly<_LinkListBinding>;
export type RouteDefinitionDocument = Readonly<_RouteDefinitionDocument>;
export type RouteDefinitionEntry = Readonly<_RouteDefinitionEntry>;
export type HowToGetHereRoutesLocale = Readonly<_HowToGetHereRoutesLocale>;
export type RouteContent = Readonly<_RouteContent>;

// Minimal surface for the guides namespace bundle used at runtime.
export type GuidesNamespace = Readonly<_GuidesNamespace>;
