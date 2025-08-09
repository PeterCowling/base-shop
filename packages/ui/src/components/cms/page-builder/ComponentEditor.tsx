// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent } from "@types";
import { memo, useCallback } from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";
import ContactFormEditor from "./ContactFormEditor";
import GalleryEditor from "./GalleryEditor";
import ImageBlockEditor from "./ImageBlockEditor";
import TestimonialsEditor from "./TestimonialsEditor";
import HeroBannerEditor from "./HeroBannerEditor";
import ValuePropsEditor from "./ValuePropsEditor";
import ReviewsCarouselEditor from "./ReviewsCarouselEditor";

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
  onResize: (patch: { width?: string | number; height?: string | number }) => void;
}

function ComponentEditor({ component, onChange, onResize }: Props) {
  if (!component) return null;

  const handleInput = useCallback(
    (field: string, value: string | number | undefined) => {
      onChange({ [field]: value } as Partial<PageComponent>);
    },
    [onChange],
  );

  let specific: React.ReactNode = null;

  switch (component.type) {
    case "ContactForm":
      specific = <ContactFormEditor component={component} onChange={onChange} />;
      break;
    case "Gallery":
      specific = <GalleryEditor component={component} onChange={onChange} />;
      break;
    case "Image":
      specific = <ImageBlockEditor component={component} onChange={onChange} />;
      break;
    case "Testimonials":
      specific = <TestimonialsEditor component={component} onChange={onChange} />;
      break;
    case "HeroBanner":
      specific = <HeroBannerEditor component={component} onChange={onChange} />;
      break;
    case "ValueProps":
      specific = <ValuePropsEditor component={component} onChange={onChange} />;
      break;
    case "ReviewsCarousel":
      specific = (
        <ReviewsCarouselEditor component={component} onChange={onChange} />
      );
      break;
    default:
      specific = <p className="text-sm text-gray-500">No editable props</p>;
  }

  return (
    <div className="space-y-2">
      <Input
        label="Width"
        value={component.width ?? ""}
        placeholder="e.g. 300px or 50%"
        onChange={(e) => onResize({ width: e.target.value })}
      />
      <Input
        label="Height"
        value={component.height ?? ""}
        placeholder="e.g. 200px or 50vh"
        onChange={(e) => onResize({ height: e.target.value })}
      />
      <Input
        label="Margin"
        value={component.margin ?? ""}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label="Padding"
        value={component.padding ?? ""}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      <Select
        value={component.position ?? ""}
        onValueChange={(v) => handleInput("position", v || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <Input
            label="Top"
            value={component.top ?? ""}
            onChange={(e) => handleInput("top", e.target.value)}
          />
          <Input
            label="Left"
            value={component.left ?? ""}
            onChange={(e) => handleInput("left", e.target.value)}
          />
        </>
      )}
      {specific}
    </div>
  );
}

export default memo(ComponentEditor);
