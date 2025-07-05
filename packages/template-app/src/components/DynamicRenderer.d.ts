import { ImageProps } from "next/image";
import React from "react";
import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@/components/ui/textarea";
import type { PageComponent } from "@types";
declare const CmsImage: React.MemoExoticComponent<({ src, alt, width, height, ...rest }: Omit<ImageProps, "src" | "alt"> & {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
}) => import("react/jsx-runtime").JSX.Element>;
declare function DynamicRenderer({ components }: {
    components: PageComponent[];
}): import("react/jsx-runtime").JSX.Element;
declare const _default: React.MemoExoticComponent<typeof DynamicRenderer>;
export default _default;
export { BlogListing, ContactForm, ContactFormWithMap, Gallery, CmsImage as Image, Testimonials, TestimonialSlider, TextBlock as Text, };
