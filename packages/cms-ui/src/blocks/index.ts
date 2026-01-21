import {
  type BlockTypeId,
  buildBlockRegistry,
  coreBlockDescriptors,
} from "@acme/page-builder-core";

import AnnouncementBar from "./AnnouncementBarBlock";
import { atomRegistry } from "./atoms";
import BlogListing from "./BlogListing";
import Button from "./Button";
import CollectionList from "./CollectionList";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import { containerRegistry } from "./containers";
import MultiColumn from "./containers/MultiColumn";
import CountdownTimer from "./CountdownTimer";
import FAQBlock from "./FAQBlock";
import FeaturedProductBlock from "./FeaturedProductBlock";
import Footer from "./FooterBlock";
import FormBuilderBlock from "./FormBuilderBlock";
import Gallery from "./Gallery";
import GiftCardBlock from "./GiftCardBlock";
import Header from "./HeaderBlock";
import HeaderCart from "./HeaderCart";
import HeroBanner from "./HeroBanner";
import ImageSlider from "./ImageSlider";
import { layoutRegistry } from "./layout";
import Lookbook from "./Lookbook";
import MapBlock from "./MapBlock";
import { moleculeRegistry } from "./molecules";
import NewsletterSignup from "./NewsletterSignup";
import { organismRegistry } from "./organisms";
import { overlayRegistry } from "./overlays";
import PopupModal from "./PopupModal";
import PricingTable from "./PricingTable";
import ProductBundle from "./ProductBundle";
import ProductCarousel from "./ProductCarousel";
import ProductComparison from "./ProductComparisonBlock";
import ProductFilter from "./ProductFilter";
import ProductGrid from "./ProductGrid.client";
import RecommendationCarousel from "./RecommendationCarousel";
import ReviewsCarousel from "./ReviewsCarousel";
import SearchBar from "./SearchBar";
import Section from "./Section";
import SocialFeed from "./SocialFeed";
import SocialLinks from "./SocialLinks";
import SocialProof from "./SocialProof";
import StoreLocatorBlock from "./StoreLocatorBlock";
import Tabs from "./Tabs";
import Testimonials from "./Testimonials";
import TestimonialSlider from "./TestimonialSlider";
import type { BlockRegistryEntry } from "./types";
import ValueProps from "./ValueProps";
import VideoBlock from "./VideoBlock";

export {
  AnnouncementBar,
  BlogListing,
  Button,
  CollectionList,
  ContactForm,
  ContactFormWithMap,
  CountdownTimer,
  FAQBlock,
  FeaturedProductBlock,
  Footer,
  FormBuilderBlock,
  Gallery,
  GiftCardBlock,
  Header,
  HeaderCart,
  HeroBanner,
  ImageSlider,
  Lookbook,
  MapBlock,
  MultiColumn,
  NewsletterSignup,
  PopupModal,
  PricingTable,
  ProductBundle,
  ProductCarousel,
  ProductComparison,
  ProductFilter,
  ProductGrid,
  RecommendationCarousel,
  ReviewsCarousel,
  SearchBar,
  Section,
  SocialFeed,
  SocialLinks,
  SocialProof,
  StoreLocatorBlock,
  Tabs,
  Testimonials,
  TestimonialSlider,
  ValueProps,
  VideoBlock,
};

export * from "./atoms";
export * from "./layout";
export * from "./molecules";
export * from "./organisms";
export * from "./overlays";

// Re-export individual registries so consumers can access them directly.
export {
  atomRegistry,
  containerRegistry,
  layoutRegistry,
  moleculeRegistry,
  organismRegistry,
  overlayRegistry,
};

export const blockRegistry: Record<string, BlockRegistryEntry<Record<string, unknown>>> = {
  ...layoutRegistry,
  ...containerRegistry,
  ...atomRegistry,
  ...moleculeRegistry,
  ...organismRegistry,
  ...overlayRegistry,
};

// Subset of the registry built from the shared core block descriptors.
// This powers runtime renderers and future tooling that rely on the
// BlockTypeId contract exported from @acme/page-builder-core.
const coreRegistryEntries = coreBlockDescriptors
  .map((descriptor: { type: string }) => {
    const entry =
      blockRegistry[descriptor.type as keyof typeof blockRegistry];
    if (!entry) return null;
    return {
      type: descriptor.type as BlockTypeId,
      entry,
    };
  })
  .filter(Boolean) as {
  type: BlockTypeId;
  entry: BlockRegistryEntry<Record<string, unknown>>;
}[];

export const { registry: coreBlockRegistry } =
  buildBlockRegistry<BlockRegistryEntry<Record<string, unknown>>>(
    coreBlockDescriptors,
    coreRegistryEntries,
  );

// Block types used by runtime and CMS; wired to the shared
// Page Builder block type id contract in @acme/page-builder-core.
export type BlockType = BlockTypeId;
