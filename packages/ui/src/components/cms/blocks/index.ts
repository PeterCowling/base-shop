import {
  buildBlockRegistry,
  coreBlockDescriptors,
  type BlockTypeId,
} from "@acme/page-builder-core";
import BlogListing from "./BlogListing";
import ContactForm from "./ContactForm";
import ContactFormWithMap from "./ContactFormWithMap";
import Gallery from "./Gallery";
import Lookbook from "./Lookbook";
import HeroBanner from "./HeroBanner";
import ProductCarousel from "./ProductCarousel";
import ProductGrid from "./ProductGrid.client";
import ReviewsCarousel from "./ReviewsCarousel";
import TestimonialSlider from "./TestimonialSlider";
import Testimonials from "./Testimonials";
import ValueProps from "./ValueProps";
import RecommendationCarousel from "./RecommendationCarousel";
import Section from "./Section";
import AnnouncementBar from "./AnnouncementBarBlock";
import MapBlock from "./MapBlock";
import StoreLocatorBlock from "./StoreLocatorBlock";
import MultiColumn from "./containers/MultiColumn";
import VideoBlock from "./VideoBlock";
import FAQBlock from "./FAQBlock";
import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
import CountdownTimer from "./CountdownTimer";
import SocialLinks from "./SocialLinks";
import Button from "./Button";
import PricingTable from "./PricingTable";
import SocialFeed from "./SocialFeed";
import SocialProof from "./SocialProof";
import NewsletterSignup from "./NewsletterSignup";
import HeaderCart from "./HeaderCart";
import Tabs from "./Tabs";
import ImageSlider from "./ImageSlider";
import CollectionList from "./CollectionList";
import SearchBar from "./SearchBar";
import ProductComparison from "./ProductComparisonBlock";
import FeaturedProductBlock from "./FeaturedProductBlock";
import GiftCardBlock from "./GiftCardBlock";
import FormBuilderBlock from "./FormBuilderBlock";
import PopupModal from "./PopupModal";
import ProductBundle from "./ProductBundle";
import ProductFilter from "./ProductFilter";
import type { BlockRegistryEntry } from "./types";

export {
  BlogListing,
  ContactForm,
  ContactFormWithMap,
  Gallery,
  Lookbook,
  HeroBanner,
  ProductCarousel,
  ProductGrid,
  RecommendationCarousel,
  ReviewsCarousel,
  Testimonials,
  TestimonialSlider,
  ValueProps,
  Section,
  AnnouncementBar,
  MapBlock,
  StoreLocatorBlock,
  MultiColumn,
  VideoBlock,
  FAQBlock,
  CountdownTimer,
  Header,
  Footer,
  SocialLinks,
  SocialFeed,
  SocialProof,
  Button,
  NewsletterSignup,
  HeaderCart,
  ImageSlider,
  SearchBar,
  PricingTable,
  Tabs,
  CollectionList,
  ProductComparison,
  FeaturedProductBlock,
  GiftCardBlock,
  FormBuilderBlock,
  ProductBundle,
  PopupModal,
  ProductFilter,
};

export * from "./atoms";
export * from "./molecules";
export * from "./organisms";
export * from "./layout";
export * from "./overlays";

import { atomRegistry } from "./atoms";
import { moleculeRegistry } from "./molecules";
import { organismRegistry } from "./organisms";
import { containerRegistry } from "./containers";
import { layoutRegistry } from "./layout";
import { overlayRegistry } from "./overlays";

// Re-export individual registries so consumers can access them directly.
export {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
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
  .map((descriptor) => {
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
