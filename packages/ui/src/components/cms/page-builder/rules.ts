import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
  overlayRegistry,
} from "../blocks";
import type { ComponentType } from "./defaults";

// Define a simple, explicit parent->children allowlist for builder-managed nesting.
// Parent can be a concrete component type or the special ROOT (top-level page canvas).
export type ParentKind = "ROOT" | ComponentType;

// Build category sets from registries
const ATOMS = new Set(Object.keys(atomRegistry) as ComponentType[]);
const MOLECULES = new Set(Object.keys(moleculeRegistry) as ComponentType[]);
const ORGANISMS = new Set(Object.keys(organismRegistry) as ComponentType[]);
const CONTAINERS = new Set(Object.keys(containerRegistry) as ComponentType[]);
const LAYOUT = new Set(Object.keys(layoutRegistry) as ComponentType[]);
const OVERLAYS = new Set(Object.keys(overlayRegistry) as ComponentType[]);

const CONTENT = new Set<ComponentType>([
  ...ATOMS,
  ...MOLECULES,
  ...ORGANISMS,
  ...OVERLAYS, // treat overlays as content children for placement
]);

// Helper to make a set
const set = (list: ComponentType[]) => new Set<ComponentType>(list);

// Allowed children mapping. Adjust as product requirements evolve.
const ALLOWED: Record<ParentKind, Set<ComponentType>> = {
  // Top level allows a Canvas-like container. Historically this was `Section`; now `Canvas` is supported too.
  ROOT: set(["Section" as ComponentType, "Canvas" as ComponentType]),

  // Containers: Section may contain content and selected containers for layouting
  Section: set([
    // layout containers that organize content
    "MultiColumn" as ComponentType,
    "StackFlex" as ComponentType,
    "Grid" as ComponentType,
    "CarouselContainer" as ComponentType,
    "TabsAccordionContainer" as ComponentType,
    "Dataset" as ComponentType,
    "Repeater" as ComponentType,
    "Bind" as ComponentType,
    // all content classes
    ...Array.from(CONTENT),
  ]),

  // Layout: Canvas behaves like the page surface and accepts containers and content
  Canvas: set([
    // layout containers that organize content
    "MultiColumn" as ComponentType,
    "StackFlex" as ComponentType,
    "Grid" as ComponentType,
    "CarouselContainer" as ComponentType,
    "TabsAccordionContainer" as ComponentType,
    "Dataset" as ComponentType,
    "Repeater" as ComponentType,
    "Bind" as ComponentType,
    // all content classes
    ...Array.from(CONTENT),
  ]),

  // Layout containers generally accept content only
  MultiColumn: set(Array.from(CONTENT)),
  StackFlex: set(Array.from(CONTENT)),
  Grid: set(Array.from(CONTENT)),
  CarouselContainer: set(Array.from(CONTENT)),
  TabsAccordionContainer: set(Array.from(CONTENT)),
  Dataset: set(Array.from(CONTENT)),
  Repeater: set(Array.from(CONTENT)),
  Bind: set(Array.from(CONTENT)),

  // Default fallbacks (for any container not explicitly listed): allow content
  // Note: We intentionally do not expose this as a wildcard; use getAllowedChildren() for fallback.
} as Record<ParentKind, Set<ComponentType>>;

// Public API
export function getAllowedChildren(parent: ParentKind): Set<ComponentType> {
  if (ALLOWED[parent]) return ALLOWED[parent];
  // For any other container from registry that is not mapped explicitly, allow CONTENT only
  if ((CONTAINERS as Set<string>).has(parent as string)) return new Set(CONTENT);
  if ((LAYOUT as Set<string>).has(parent as string)) return new Set(CONTENT);
  // Unknown parent: disallow all
  return new Set<ComponentType>();
}

export function canDropChild(parent: ParentKind, child: ComponentType): boolean {
  return getAllowedChildren(parent).has(child);
}

export function isContainerType(t: string): boolean {
  return CONTAINERS.has(t as ComponentType);
}

export function isTopLevelAllowed(t: ComponentType): boolean {
  return canDropChild("ROOT", t);
}
