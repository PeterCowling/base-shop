// src/types/content.ts
// Centralised content-type exports to reduce drift across the app.
// Surfaces readonly versions of frequently-used inferred Zod types.

import type {
  LinkTarget as _LinkTarget,
  LinkBinding as _LinkBinding,
  MediaBinding as _MediaBinding,
  GalleryBindingItem as _GalleryBindingItem,
  GalleryBinding as _GalleryBinding,
  LinkListBindingItem as _LinkListBindingItem,
  LinkListBinding as _LinkListBinding,
  RouteDefinitionDocument as _RouteDefinitionDocument,
  RouteDefinitionEntry as _RouteDefinitionEntry,
  HowToGetHereRoutesLocale as _HowToGetHereRoutesLocale,
  RouteContent as _RouteContent,
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
