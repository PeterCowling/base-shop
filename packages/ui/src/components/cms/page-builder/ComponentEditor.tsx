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
import AnnouncementBarEditor from "./AnnouncementBarEditor";
import MapBlockEditor from "./MapBlockEditor";
import VideoBlockEditor from "./VideoBlockEditor";
import FAQBlockEditor from "./FAQBlockEditor";

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
  onResize: (patch: {
    width?: string;
    height?: string;
    top?: string;
    left?: string;
  }) => void;
}

function ComponentEditor({ component, onChange, onResize }: Props) {
  if (!component) return null;

  const handleInput = useCallback(
    (field: string, value: string | number | undefined) => {
      onChange({ [field]: value } as Partial<PageComponent>);
    },
    [onChange]
  );

  let specific: React.ReactNode = null;

  switch (component.type) {
    case "ContactForm":
      specific = (
        <ContactFormEditor component={component} onChange={onChange} />
      );
      break;
    case "Gallery":
      specific = <GalleryEditor component={component} onChange={onChange} />;
      break;
    case "Image":
      specific = <ImageBlockEditor component={component} onChange={onChange} />;
      break;
    case "Testimonials":
      specific = (
        <TestimonialsEditor component={component} onChange={onChange} />
      );
      break;
    case "HeroBanner":
      specific = <HeroBannerEditor component={component} onChange={onChange} />;
      break;
    case "AnnouncementBar":
      specific = (
        <AnnouncementBarEditor component={component} onChange={onChange} />
      );
      break;
    case "ValueProps":
      specific = <ValuePropsEditor component={component} onChange={onChange} />;
      break;
    case "ReviewsCarousel":
      specific = (
        <ReviewsCarouselEditor component={component} onChange={onChange} />
      );
      break;
    case "MapBlock":
      specific = <MapBlockEditor component={component} onChange={onChange} />;
      break;
    case "VideoBlock":
      specific = <VideoBlockEditor component={component} onChange={onChange} />;
      break;
    case "FAQBlock":
      specific = <FAQBlockEditor component={component} onChange={onChange} />;
      break;
    case "CountdownTimer":
      specific = (
        <div className="space-y-2">
          <Input
            label="Target Date"
            type="datetime-local"
            value={(component as any).targetDate ?? ""}
            onChange={(e) => handleInput("targetDate", e.target.value)}
          />
          <Input
            label="Timezone"
            value={(component as any).timeZone ?? ""}
            onChange={(e) => handleInput("timeZone", e.target.value)}
            placeholder="e.g. America/New_York"
          />
          <Input
            label="Completion Text"
            value={(component as any).completionText ?? ""}
            onChange={(e) => handleInput("completionText", e.target.value)}
          />
          <Input
            label="Class Name"
            value={(component as any).className ?? ""}
            onChange={(e) => handleInput("className", e.target.value)}
            placeholder="optional styles"
          />
        </div>
      );
      break;
    default:
      specific = <p className="text-muted text-sm">No editable props</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Input
          label="Width"
          placeholder="e.g. 100px or 50%"
          value={component.width ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            onResize({ width: v || undefined });
          }}
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
          onChange={(e) => {
            const v = e.target.value.trim();
            onResize({ height: v || undefined });
          }}
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
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("minItems", undefined);
                return;
              }
              const max = (component as any).maxItems;
              const patch: Partial<PageComponent> = { minItems: val };
              if (max !== undefined && val > max) {
                patch.maxItems = val;
              }
              onChange(patch);
            }}
            min={0}
            max={(component as any).maxItems ?? undefined}
          />
          <Input
            label="Max Items"
            type="number"
            value={(component as any).maxItems ?? ""}
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("maxItems", undefined);
                return;
              }
              const min = (component as any).minItems;
              const patch: Partial<PageComponent> = { maxItems: val };
              if (min !== undefined && val < min) {
                patch.minItems = val;
              }
              onChange(patch);
            }}
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
          min={(component as any).minItems}
          max={(component as any).maxItems}
        />
      )}
      {"gap" in component && (
        <Input
          label="Gap"
          value={(component as any).gap ?? ""}
          onChange={(e) => handleInput("gap", e.target.value)}
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
            onChange={(e) => {
              const v = e.target.value.trim();
              onResize({ top: v || undefined });
            }}
          />
          <Input
            label="Left"
            value={component.left ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              onResize({ left: v || undefined });
            }}
          />
        </>
      )}
      {specific}
    </div>
  );
}

export default memo(ComponentEditor);
