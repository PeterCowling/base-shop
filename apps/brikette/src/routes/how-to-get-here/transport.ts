import { Bus, Car, Footprints, Ship, TrainFront } from "@/icons";

import type {
  AugmentedDestinationLink,
  AugmentedDestinationSection,
  DestinationLink,
  IconComponent,
  NormalizedDestinationSection,
  RouteDirection,
  TransportMode,
} from "./types";

export const TRANSPORT_MODE_ICONS: Record<TransportMode, IconComponent> = {
  bus: Bus,
  ferry: Ship,
  train: TrainFront,
  car: Car,
  walk: Footprints,
};

export const TRANSPORT_MODE_ORDER: TransportMode[] = ["bus", "ferry", "train", "car", "walk"];
export const DIRECTION_ORDER: RouteDirection[] = ["to", "from"];

const WORD_BOUNDARY_PREFIX = "(?:^|[^a-z])";
const WORD_BOUNDARY_SUFFIX = "(?:$|[^a-z])";

const transportMatchers: Array<{ pattern: RegExp; Icon: IconComponent; mode: TransportMode }> = [
  { pattern: new RegExp(`${WORD_BOUNDARY_PREFIX}(ferry|boat|dock|marina|ship)${WORD_BOUNDARY_SUFFIX}`), Icon: Ship, mode: "ferry" },
  { pattern: new RegExp(`${WORD_BOUNDARY_PREFIX}(bus|shuttle)${WORD_BOUNDARY_SUFFIX}`), Icon: Bus, mode: "bus" },
  { pattern: new RegExp(`${WORD_BOUNDARY_PREFIX}(train|rail)${WORD_BOUNDARY_SUFFIX}`), Icon: TrainFront, mode: "train" },
  { pattern: new RegExp(`${WORD_BOUNDARY_PREFIX}(taxi|cab|car|drive)${WORD_BOUNDARY_SUFFIX}`), Icon: Car, mode: "car" },
  { pattern: new RegExp(`${WORD_BOUNDARY_PREFIX}(walk|stairs|foot|hike)${WORD_BOUNDARY_SUFFIX}`), Icon: Footprints, mode: "walk" },
];

const routeMetadataOverrides: Record<string, Partial<{ transportModes: TransportMode[]; direction: RouteDirection }>> = {
  "amalfi-positano-bus": { direction: "to", transportModes: ["bus"] },
  "amalfi-positano-ferry": { direction: "to", transportModes: ["ferry"] },
  "capri-positano-ferry": { direction: "to", transportModes: ["ferry"] },
  "chiesa-nuova-bar-internazionale-to-hostel-brikette": {
    direction: "to",
    transportModes: ["walk"],
  },
  "hostel-brikette-to-chiesa-nuova-bar-internazionale": {
    direction: "from",
    transportModes: ["walk"],
  },
  "ferry-dock-to-hostel-brikette-with-luggage": {
    direction: "to",
    transportModes: ["walk"],
  },
  "hostel-brikette-to-ferry-dock-with-luggage": {
    direction: "from",
    transportModes: ["walk"],
  },
  "naples-airport-positano-bus": { direction: "to", transportModes: ["bus"] },
  "naples-center-positano-ferry": { direction: "to", transportModes: ["ferry"] },
  "naples-center-train-bus": { direction: "to", transportModes: ["train", "bus"] },
  "positano-amalfi-bus": { direction: "from", transportModes: ["bus"] },
  "positano-amalfi-ferry": { direction: "from", transportModes: ["ferry"] },
  "positano-capri-ferry": { direction: "from", transportModes: ["ferry"] },
  "positano-naples-airport-bus": { direction: "from", transportModes: ["bus"] },
  "positano-naples-center-bus-train": { direction: "from", transportModes: ["bus", "train"] },
  "positano-naples-center-ferry": { direction: "from", transportModes: ["ferry"] },
  "positano-ravello-bus": { direction: "from", transportModes: ["bus"] },
  "positano-ravello-ferry-bus": { direction: "from", transportModes: ["ferry", "bus"] },
  "positano-salerno-bus": { direction: "from", transportModes: ["bus"] },
  "positano-salerno-ferry": { direction: "from", transportModes: ["ferry"] },
  "positano-to-naples-directions-by-ferry": { direction: "from", transportModes: ["ferry"] },
  "ravello-positano-bus": { direction: "to", transportModes: ["bus"] },
  "salerno-positano-bus": { direction: "to", transportModes: ["bus"] },
  "salerno-positano-ferry": { direction: "to", transportModes: ["ferry"] },
};

function resolveTransportIconFromMode(mode: TransportMode) {
  const matchByMode = transportMatchers.find(({ mode: matcherMode }) => matcherMode === mode);
  return matchByMode?.Icon ?? null;
}

export function resolveTransportIcon(link: DestinationLink | AugmentedDestinationLink): IconComponent | null {
  const target = `${link.label ?? ""} ${link.href ?? ""}`.toLowerCase();

  if ("transportModes" in link && Array.isArray(link.transportModes) && link.transportModes.length > 0) {
    const primaryMode = link.transportModes[0];
    if (!primaryMode) return null;
    const iconFromMode = resolveTransportIconFromMode(primaryMode);
    if (iconFromMode) {
      if (primaryMode !== "car") {
        return iconFromMode;
      }

      const carMatcher = transportMatchers.find(({ mode }) => mode === "car");
      if (carMatcher?.pattern.test(target)) {
        return iconFromMode;
      }
    }
  }

  const match = transportMatchers.find(({ pattern }) => pattern.test(target));
  return match?.Icon ?? null;
}

export function resolveDirection(slug: string, override?: RouteDirection): RouteDirection {
  if (override) {
    return override;
  }

  if (slug.startsWith("positano-")) {
    return "from";
  }

  if (slug.includes("positano")) {
    return "to";
  }

  return "to";
}

export function resolveTransportModes(link: DestinationLink, override?: TransportMode[]): TransportMode[] {
  if (override && override.length) {
    return override;
  }

  const target = `${link.label ?? ""} ${link.href ?? ""}`.toLowerCase();
  const modes = transportMatchers
    .filter(({ pattern }) => pattern.test(target))
    .map(({ mode }) => mode);

  if (modes.length) {
    return Array.from(new Set(modes));
  }

  return ["bus"];
}

export function augmentLink(link: DestinationLink): AugmentedDestinationLink {
  const slug = (link.href ?? "").toLowerCase();
  const overrides = routeMetadataOverrides[slug];
  const directionOverride = overrides?.direction ?? link.direction;
  const transportModesOverride = overrides?.transportModes ?? link.transportModes;
  const direction = resolveDirection(slug, directionOverride);
  const transportModes = resolveTransportModes(link, transportModesOverride);

  return {
    ...link,
    direction,
    transportModes,
  } satisfies AugmentedDestinationLink;
}

export function augmentDestinationSections(
  sections: NormalizedDestinationSection[],
): AugmentedDestinationSection[] {
  return sections.map((section) => ({
    ...section,
    links: section.links.map(augmentLink),
  }));
}
