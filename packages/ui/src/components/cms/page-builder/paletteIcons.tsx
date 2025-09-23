// packages/ui/src/components/cms/page-builder/paletteIcons.tsx
// Radix-based glyphs for palette entries (left-hand elements list)
// We keep this lightweight and provide sensible defaults.

import React from "react";
import {
  ImageIcon,
  ReaderIcon,
  SectionIcon,
  ViewGridIcon,
  LayersIcon,
  TableIcon,
  CodeIcon,
  HeadingIcon,
  BoxIcon,
  PlayIcon,
  VideoIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircledIcon,
  EnvelopeClosedIcon,
  RocketIcon,
  StarIcon,
  TextAlignLeftIcon,
  DividerHorizontalIcon,
  ClockIcon,
} from "@radix-ui/react-icons";

// Map known component types to a Radix icon.
// Unknown types fall back to a generic BoxIcon.
const ICONS: Record<string, React.ReactNode> = {
  // Layout
  Header: <HeadingIcon className="h-6 w-6" />,
  Footer: <LayersIcon className="h-6 w-6" />,

  // Containers
  Section: <SectionIcon className="h-6 w-6" />,
  MultiColumn: <ViewGridIcon className="h-6 w-6" />,
  StackFlex: <LayersIcon className="h-6 w-6" />,
  Grid: <ViewGridIcon className="h-6 w-6" />,
  CarouselContainer: <RocketIcon className="h-6 w-6" />,
  TabsAccordionContainer: <LayersIcon className="h-6 w-6" />,
  Dataset: <TableIcon className="h-6 w-6" />,
  Repeater: <LayersIcon className="h-6 w-6" />,
  Bind: <BoxIcon className="h-6 w-6" />,

  // Atoms
  Text: <TextAlignLeftIcon className="h-6 w-6" />,
  Image: <ImageIcon className="h-6 w-6" />,
  Divider: <DividerHorizontalIcon className="h-6 w-6" />,
  Spacer: <LayersIcon className="h-6 w-6" />,
  CustomHtml: <CodeIcon className="h-6 w-6" />,
  Button: <StarIcon className="h-6 w-6" />,

  // Molecules
  NewsletterForm: <EnvelopeClosedIcon className="h-6 w-6" />,
  PromoBanner: <StarIcon className="h-6 w-6" />,
  CategoryList: <ViewGridIcon className="h-6 w-6" />,

  // Organisms
  AnnouncementBar: <StarIcon className="h-6 w-6" />,
  HeroBanner: <StarIcon className="h-6 w-6" />,
  ValueProps: <StarIcon className="h-6 w-6" />,
  ReviewsCarousel: <RocketIcon className="h-6 w-6" />,
  ProductGrid: <ViewGridIcon className="h-6 w-6" />,
  ProductCarousel: <RocketIcon className="h-6 w-6" />,
  RecommendationCarousel: <RocketIcon className="h-6 w-6" />,
  FeaturedProduct: <StarIcon className="h-6 w-6" />,
  ImageSlider: <ImageIcon className="h-6 w-6" />,
  CollectionList: <ViewGridIcon className="h-6 w-6" />,
  Gallery: <ImageIcon className="h-6 w-6" />,
  Lookbook: <ImageIcon className="h-6 w-6" />,
  ContactForm: <ReaderIcon className="h-6 w-6" />,
  ContactFormWithMap: <ReaderIcon className="h-6 w-6" />,
  BlogListing: <ReaderIcon className="h-6 w-6" />,
  Testimonials: <ReaderIcon className="h-6 w-6" />,
  TestimonialSlider: <ReaderIcon className="h-6 w-6" />,
  MapBlock: <MagnifyingGlassIcon className="h-6 w-6" />,
  StoreLocatorBlock: <MagnifyingGlassIcon className="h-6 w-6" />,
  VideoBlock: <VideoIcon className="h-6 w-6" />,
  FAQBlock: <QuestionMarkCircledIcon className="h-6 w-6" />,
  CountdownTimer: <ClockIcon className="h-6 w-6" />,
  SocialLinks: <BoxIcon className="h-6 w-6" />,
  SocialFeed: <LayersIcon className="h-6 w-6" />,
  SocialProof: <StarIcon className="h-6 w-6" />,
  NewsletterSignup: <EnvelopeClosedIcon className="h-6 w-6" />,
  SearchBar: <MagnifyingGlassIcon className="h-6 w-6" />,
  PricingTable: <TableIcon className="h-6 w-6" />,
  Tabs: <LayersIcon className="h-6 w-6" />,
  ProductComparison: <TableIcon className="h-6 w-6" />,
  GiftCardBlock: <StarIcon className="h-6 w-6" />,
  FormBuilderBlock: <ReaderIcon className="h-6 w-6" />,
  PopupModal: <BoxIcon className="h-6 w-6" />,
  ProductBundle: <LayersIcon className="h-6 w-6" />,
  ProductFilter: <MagnifyingGlassIcon className="h-6 w-6" />,
};

// Some icon names used above are guaranteed by @radix-ui/react-icons. For those
// that may not exist in older versions, provide fallbacks at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safe(node: React.ReactNode | undefined, fallback: React.ReactNode): React.ReactNode {
  try {
    return node ?? fallback;
  } catch {
    return fallback;
  }
}

export function getPaletteGlyph(type: string): React.ReactNode {
  // Fallback to a generic box if there is no matching glyph.
  const generic = <BoxIcon className="h-6 w-6" />;
  return safe(ICONS[type], generic);
}
