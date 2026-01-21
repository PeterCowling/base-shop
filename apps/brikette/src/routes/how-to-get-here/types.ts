import type { ComponentPropsWithoutRef, ComponentType, PropsWithChildren } from "react";

import type { AppLanguage } from "@/i18n.config";
import type { LinkBinding, RouteDefinition } from "@/lib/how-to-get-here/definitions";
import type { RouteContent } from "@/lib/how-to-get-here/schema";
import type { GuideKey } from "@/routes.guides-helpers";

export type RouteDirection = "to" | "from";

export type TransportMode = "bus" | "ferry" | "train" | "car" | "walk";

export type RouteFacts = {
  duration?: string;
  cost?: string;
  walking?: string;
  luggageFriendly?: 1 | 2 | 3;
  seasonality?: string;
};

export type DestinationLink = {
  label: string;
  href: string;
  internal?: boolean;
  external?: boolean;
  direction?: RouteDirection;
  transportModes?: TransportMode[];
  summary?: string;
  facts?: RouteFacts;
  groupKey?: string;
};

export type RichTextTextPart = {
  type: "text";
  value: string;
};

export type RichTextLinkPart = DestinationLink & {
  type: "link";
};

export type RichTextPart = RichTextTextPart | RichTextLinkPart;

export type RichText = {
  parts: RichTextPart[];
};

export type DestinationSectionImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type DestinationSection = {
  name: string;
  description?: string;
  image?: DestinationSectionImage;
  links?: DestinationLink[] | Record<string, DestinationLink> | DestinationLink;
};

export type NormalizedDestinationSection = {
  id: string;
  name: string;
  description?: string;
  links: DestinationLink[];
  image?: DestinationSectionImage;
};

export type SorrentoContent = {
  title?: string;
  links?: DestinationLink[] | Record<string, DestinationLink> | DestinationLink;
};

export type NormalizedSorrentoContent = {
  title: string;
  links: DestinationLink[];
};

export type AugmentedDestinationLink = DestinationLink & {
  direction: RouteDirection;
  transportModes: TransportMode[];
};

export type AugmentedDestinationSection = Omit<
  NormalizedDestinationSection,
  "links"
> & {
  links: AugmentedDestinationLink[];
};

export type ExperienceGuide = {
  guideKey: GuideKey;
  label: string;
  summary: string;
  transportModes: TransportMode[];
};

export type ExperienceGuidesContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: ExperienceGuide[];
};

export type RomeColumn = {
  heading: string;
  points: string[];
};

export type RomeOption = {
  route: DestinationLink;
  toRome: RomeColumn;
  toHostel: RomeColumn;
  note?: RichText;
};

export type RomeTable = {
  headers: {
    route: string;
    toRome: string;
    toHostel: string;
  };
  options: RomeOption[];
};

export type HeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
  stats?: {
    routes?: string;
    destinations?: string;
    transport?: string;
    [key: string]: string | undefined;
  };
};

export type TransportFilter = "all" | TransportMode;

export type DirectionFilter = "all" | RouteDirection;

export type DestinationFilter = "all" | string;

export type IconComponent = ComponentType<{ className?: string; size?: number | string }>;

export type InlineListProps = ComponentPropsWithoutRef<"ul">;

export type IntroHighlightCardProps = PropsWithChildren<{
  eyebrow: string;
}>;

export type OverviewLoaderData = {
  lang: AppLanguage;
  title: string;
  desc: string;
};

export type LoaderData = {
  lang: AppLanguage;
  slug: string;
  definition: RouteDefinition;
  content: RouteContent;
  howToSlug: string;
  guidesSlug: string;
  showChiesaNuovaDetails: boolean;
};

export type RouteLoaderData = LoaderData;

export type LinkContext = {
  lang: AppLanguage;
  howToSlug: string;
  guidesSlug: string;
};

export type RenderContext = {
  definition: RouteDefinition;
  content: RouteContent;
  context: LinkContext;
};

export type BindingLookupResult = {
  binding: LinkBinding | undefined;
  bindingPath: string;
};
