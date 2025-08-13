// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { memo, useCallback } from "react";
import {
  Button,
  Input,
  Textarea,
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
import SocialFeedEditor from "./SocialFeedEditor";
import SocialProofEditor from "./SocialProofEditor";
import MapBlockEditor from "./MapBlockEditor";
import StoreLocatorBlockEditor from "./StoreLocatorBlockEditor";
import VideoBlockEditor from "./VideoBlockEditor";
import FAQBlockEditor from "./FAQBlockEditor";
import HeaderEditor from "./HeaderEditor";
import FooterEditor from "./FooterEditor";
import PricingTableEditor from "./PricingTableEditor";
import NewsletterSignupEditor from "./NewsletterSignupEditor";
import ImageSliderEditor from "./ImageSliderEditor";
import CollectionListEditor from "./CollectionListEditor";
import SearchBarEditor from "./SearchBarEditor";
import RecommendationCarouselEditor from "./RecommendationCarouselEditor";
import ProductComparisonEditor from "./ProductComparisonEditor";

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
  onResize: (patch: {
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    widthDesktop?: string;
    widthTablet?: string;
    widthMobile?: string;
    heightDesktop?: string;
    heightTablet?: string;
    heightMobile?: string;
    marginDesktop?: string;
    marginTablet?: string;
    marginMobile?: string;
    paddingDesktop?: string;
    paddingTablet?: string;
    paddingMobile?: string;
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
    case "PricingTable":
      specific = (
        <PricingTableEditor component={component} onChange={onChange} />
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
    case "NewsletterSignup":
      specific = (
        <NewsletterSignupEditor component={component} onChange={onChange} />
      );
      break;
    case "SearchBar":
      specific = (
        <SearchBarEditor component={component} onChange={onChange} />
      );
      break;
    case "ImageSlider":
      specific = <ImageSliderEditor component={component} onChange={onChange} />;
      break;
    case "CollectionList":
      specific = (
        <CollectionListEditor component={component} onChange={onChange} />
      );
      break;
    case "RecommendationCarousel":
      specific = (
        <RecommendationCarouselEditor component={component} onChange={onChange} />
      );
      break;
    case "ProductComparison":
      specific = (
        <ProductComparisonEditor component={component} onChange={onChange} />
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
    case "SocialFeed":
      specific = <SocialFeedEditor component={component} onChange={onChange} />;
      break;
    case "SocialProof":
      specific = (
        <SocialProofEditor component={component} onChange={onChange} />
      );
      break;
    case "MapBlock":
      specific = <MapBlockEditor component={component} onChange={onChange} />;
      break;
    case "StoreLocatorBlock":
      specific = (
        <StoreLocatorBlockEditor component={component} onChange={onChange} />
      );
      break;
    case "VideoBlock":
      specific = <VideoBlockEditor component={component} onChange={onChange} />;
      break;
    case "FAQBlock":
      specific = <FAQBlockEditor component={component} onChange={onChange} />;
      break;
    case "CountdownTimer":
      specific = (
        <>
          <Input
            label="Target Date"
            type="datetime-local"
            value={(component as any).targetDate ?? ""}
            onChange={(e) => handleInput("targetDate", e.target.value)}
          />
          <Input
            label="Timezone"
            value={(component as any).timezone ?? ""}
            onChange={(e) => handleInput("timezone", e.target.value)}
          />
          <Input
            label="Completion Text"
            value={(component as any).completionText ?? ""}
            onChange={(e) => handleInput("completionText", e.target.value)}
          />
          <Input
            label="Styles"
            value={(component as any).styles ?? ""}
            onChange={(e) => handleInput("styles", e.target.value)}
          />
        </>
      );
      break;
    case "SocialLinks":
      specific = (
        <>
          <Input
            label="Facebook URL"
            value={(component as any).facebook ?? ""}
            onChange={(e) => handleInput("facebook", e.target.value)}
          />
          <Input
            label="Instagram URL"
            value={(component as any).instagram ?? ""}
            onChange={(e) => handleInput("instagram", e.target.value)}
          />
          <Input
            label="X URL"
            value={(component as any).x ?? ""}
            onChange={(e) => handleInput("x", e.target.value)}
          />
          <Input
            label="YouTube URL"
            value={(component as any).youtube ?? ""}
            onChange={(e) => handleInput("youtube", e.target.value)}
          />
          <Input
            label="LinkedIn URL"
            value={(component as any).linkedin ?? ""}
            onChange={(e) => handleInput("linkedin", e.target.value)}
          />
        </>
      );
      break;
    case "Header":
      specific = <HeaderEditor component={component} onChange={onChange} />;
      break;
    case "Footer":
      specific = <FooterEditor component={component} onChange={onChange} />;
      break;
    case "Button":
      specific = (
        <>
          <Input
            label="Label"
            value={(component as any).label ?? ""}
            onChange={(e) => handleInput("label", e.target.value)}
          />
          <Input
            label="URL"
            value={(component as any).href ?? ""}
            onChange={(e) => handleInput("href", e.target.value)}
          />
          <Select
            value={(component as any).variant ?? ""}
            onValueChange={(v) => handleInput("variant", v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="outline">outline</SelectItem>
              <SelectItem value="ghost">ghost</SelectItem>
              <SelectItem value="destructive">destructive</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
      break;
    case "Tabs": {
      const labels = (component as any).labels ?? [];
      const active = (component as any).active ?? 0;
      specific = (
        <>
          {labels.map((label: string, i: number) => (
            <div key={i} className="flex items-end gap-2">
              <Input
                label={`Tab ${i + 1} Label`}
                value={label}
                onChange={(e) => {
                  const copy = [...labels];
                  copy[i] = e.target.value;
                  onChange({ labels: copy });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const copy = labels.filter((_: string, idx: number) => idx !== i);
                  const patch: Partial<PageComponent> = { labels: copy };
                  if (active >= copy.length) patch.active = 0;
                  onChange(patch);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ labels: [...labels, ""] })}
          >
            Add Tab
          </Button>
          <Select
            value={String(active)}
            onValueChange={(v) =>
              onChange({ active: v === undefined ? undefined : Number(v) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Active Tab" />
            </SelectTrigger>
            <SelectContent>
              {labels.map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {`Tab ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      );
      break;
    }
    case "ProductGrid":
    case "ProductCarousel":
      specific = (
        <>
          <Select
            value={(component as any).mode ?? "collection"}
            onValueChange={(v) => handleInput("mode", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="manual">Manual SKUs</SelectItem>
            </SelectContent>
          </Select>
          {(component as any).mode === "collection" ? (
            <Input
              label="Collection ID"
              value={(component as any).collectionId ?? ""}
              onChange={(e) => handleInput("collectionId", e.target.value)}
            />
          ) : (
            <Textarea
              label="SKUs (comma separated)"
              value={((component as any).skus ?? []).join(",")}
              onChange={(e) =>
                handleInput(
                  "skus",
                  e.target.value
                    .split(/[\s,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          )}
        </>
      );
      break;
    case "CustomHtml":
      specific = (
        <Textarea
          label="HTML"
          value={(component as any).html ?? ""}
          onChange={(e) => handleInput("html", e.target.value)}
        />
      );
      break;
    default:
      specific = <p className="text-muted text-sm">No editable props</p>;
  }

  return (
    <div className="space-y-2">
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label={`Width (${vp})`}
              placeholder="e.g. 100px or 50%"
              value={(component as any)[`width${vp}`] ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onResize({ [`width${vp}`]: v || undefined } as any);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onResize({ [`width${vp}`]: "100%" } as any)
              }
            >
              Full width
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label={`Height (${vp})`}
              placeholder="e.g. 1px or 1rem"
              value={(component as any)[`height${vp}`] ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                onResize({ [`height${vp}`]: v || undefined } as any);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onResize({ [`height${vp}`]: "100%" } as any)
              }
            >
              Full height
            </Button>
          </div>
          <Input
            label={`Margin (${vp})`}
            value={(component as any)[`margin${vp}`] ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              onResize({ [`margin${vp}`]: v || undefined } as any);
            }}
          />
          <Input
            label={`Padding (${vp})`}
            value={(component as any)[`padding${vp}`] ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              onResize({ [`padding${vp}`]: v || undefined } as any);
            }}
          />
        </div>
      ))}
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
      {("desktopItems" in component ||
        "tabletItems" in component ||
        "mobileItems" in component) && (
        <>
          <Input
            label="Desktop Items"
            type="number"
            value={(component as any).desktopItems ?? ""}
            onChange={(e) =>
              handleInput(
                "desktopItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
          />
          <Input
            label="Tablet Items"
            type="number"
            value={(component as any).tabletItems ?? ""}
            onChange={(e) =>
              handleInput(
                "tabletItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
          />
          <Input
            label="Mobile Items"
            type="number"
            value={(component as any).mobileItems ?? ""}
            onChange={(e) =>
              handleInput(
                "mobileItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
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
