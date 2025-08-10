// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent } from "@types";
import { memo, useCallback } from "react";
import {
  Button,
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
  onResize: (patch: { width?: string; height?: string }) => void;
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
      specific = <p className="text-sm text-muted">No editable props</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Input
          label="Width"
          placeholder="e.g. 100px or 50%"
          value={component.width ?? ""}
          onChange={(e) =>
            onResize({ width: e.target.value ? e.target.value : undefined })
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onResize({ width: "100%" })}
        >
          Full width
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <Input
          label="Height"
          placeholder="e.g. 100px or 50%"
          value={component.height ?? ""}
          onChange={(e) =>
            onResize({ height: e.target.value ? e.target.value : undefined })
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onResize({ height: "100%" })}
        >
          Full height
        </Button>
      </div>
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
      {("minItems" in component || "maxItems" in component) && (
        <>
          <Input
            label="Min Items"
            type="number"
            value={(component as any).minItems ?? ""}
            onChange={(e) =>
              handleInput(
                "minItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
            max={(component as any).maxItems ?? undefined}
          />
          <Input
            label="Max Items"
            type="number"
            value={(component as any).maxItems ?? ""}
            onChange={(e) =>
              handleInput(
                "maxItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={(component as any).minItems ?? 0}
          />
        </>
      )}
      {"columns" in component && (
        <Input
          label="Columns"
          type="number"
          value={(component as any).columns ?? ""}
          onChange={(e) =>
            handleInput(
              "columns",
              e.target.value === "" ? undefined : Number(e.target.value)
            )
          }
          min={(component as any).minItems ?? (component as any).minCols}
          max={(component as any).maxItems ?? (component as any).maxCols}
        />
      )}
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
