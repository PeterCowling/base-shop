// packages/ui/src/components/cms/page-builder/SectionEditor.tsx
"use client";

import { useCallback, useMemo, useState } from "react";

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
import type { PageComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import usePreviewTokens from "./hooks/usePreviewTokens";
import ImageEditor, { type ImageEditState } from "./ImageEditor";
import OverlayPicker from "./OverlayPicker";
import { extractTextThemes, type TextTheme } from "./textThemes";

type SectionExtra = PageComponent & {
  backgroundImageUrl?: string;
  backgroundFocalPoint?: { x: number; y: number };
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundAttachment?: 'scroll' | 'fixed' | 'local';
  backgroundOverlay?: string;
  backgroundVideoUrl?: string;
  backgroundVideoPoster?: string;
  backgroundVideoLoop?: boolean;
  backgroundVideoMuted?: boolean;
  sectionParallax?: number;
  textTheme?: string;
  heightPreset?: 'auto' | 'compact' | 'standard' | 'tall' | 'full';
  minHeight?: string;
  styles?: string;
  equalizeInnerHeights?: boolean;
  topShapePreset?: 'wave' | 'tilt' | 'curve' | 'mountain' | 'triangle';
  topShapeColor?: string;
  topShapeHeight?: number;
  topShapeFlipX?: boolean;
  bottomShapePreset?: 'wave' | 'tilt' | 'curve' | 'mountain' | 'triangle';
  bottomShapeColor?: string;
  bottomShapeHeight?: number;
  bottomShapeFlipX?: boolean;
};
type Props = EditorProps<SectionExtra>;

function useFilterValue(component: SectionExtra, onChange: (patch: Partial<SectionExtra>) => void) {
  const initialFilter = useMemo(() => {
    try {
      const raw = component.styles as string | undefined;
      if (!raw) return undefined;
      const parsed = JSON.parse(String(raw)) as { effects?: { filter?: string } };
      return parsed?.effects?.filter;
    } catch {
      return undefined;
    }
  }, [component.styles]);

  const applyFilter = useCallback(
    (filter: string | undefined) => {
      try {
        const raw = component.styles as string | undefined;
        const base = raw ? (JSON.parse(String(raw)) as Record<string, unknown>) : {};
        const next = { ...base, effects: { ...(base.effects ?? {}), filter } };
        onChange({ styles: JSON.stringify(next) });
      } catch {
        const next = { effects: { filter } };
        onChange({ styles: JSON.stringify(next) });
      }
    },
    [component.styles, onChange]
  );

  return { initialFilter, applyFilter };
}

interface TextThemeSectionProps {
  component: SectionExtra;
  textThemes: TextTheme[];
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function TextThemeSection({ component, textThemes, onChange, t }: TextThemeSectionProps) {
  return (
    <Select
      value={component.textTheme ?? ""}
      onValueChange={(v) => onChange({ textTheme: (v || undefined) as string | undefined })}
    >
      <SelectTrigger>
        <SelectValue placeholder={t("Text theme")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{t("Default")}</SelectItem>
        {textThemes.map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface HeightSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function HeightSection({ component, onChange, t }: HeightSectionProps) {
  return (
    <Select
      value={component.heightPreset ?? ""}
      onValueChange={(v) =>
        onChange({ heightPreset: (v || undefined) as SectionExtra["heightPreset"] | undefined })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder={t("Height preset")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">{t("Auto")}</SelectItem>
        <SelectItem value="compact">{t("Compact")}</SelectItem>
        <SelectItem value="standard">{t("Standard")}</SelectItem>
        <SelectItem value="tall">{t("Tall")}</SelectItem>
        <SelectItem value="full">{t("Full screen")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface MinHeightSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function MinHeightSection({ component, onChange, t }: MinHeightSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Input
        label={t("Min height")}
        placeholder={t("e.g. 480px or 80svh")}
        value={component.minHeight ?? ""}
        onChange={(e) => onChange({ minHeight: e.target.value || undefined })}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange({ minHeight: "100svh" })}
        title={t("Set full viewport height")}
      >
        {t("Full (100svh)")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange({ minHeight: undefined })}
        title={t("Clear minimum height")}
      >
        {t("Clear min")}
      </Button>
    </div>
  );
}

interface BackgroundImageSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  onOpenEditor: () => void;
  t: (s: string) => string;
}

function BackgroundImageSection({ component, onChange, onOpenEditor, t }: BackgroundImageSectionProps) {
  return (
    <>
      <div className="flex items-start gap-2">
        <Input
          label={t("Background image URL")}
          value={component.backgroundImageUrl ?? ""}
          onChange={(e) => onChange({ backgroundImageUrl: e.target.value || undefined })}
          placeholder="https://..."
        />
        <Button
          type="button"
          variant="outline"
          disabled={!component.backgroundImageUrl}
          onClick={onOpenEditor}
        >
          {t("Focal")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={component.backgroundSize ?? ""}
          onValueChange={(v) =>
            onChange({ backgroundSize: (v || undefined) as SectionExtra["backgroundSize"] | undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Size")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">{t("cover")}</SelectItem>
            <SelectItem value="contain">{t("contain")}</SelectItem>
            <SelectItem value="auto">{t("auto")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={component.backgroundRepeat ?? ""}
          onValueChange={(v) =>
            onChange({ backgroundRepeat: (v || undefined) as SectionExtra["backgroundRepeat"] | undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Repeat")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-repeat">{t("no-repeat")}</SelectItem>
            <SelectItem value="repeat">{t("repeat")}</SelectItem>
            <SelectItem value="repeat-x">{t("repeat-x")}</SelectItem>
            <SelectItem value="repeat-y">{t("repeat-y")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={component.backgroundAttachment ?? ""}
          onValueChange={(v) =>
            onChange({ backgroundAttachment: (v || undefined) as SectionExtra["backgroundAttachment"] | undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Attachment")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scroll">{t("scroll")}</SelectItem>
            <SelectItem value="fixed">{t("fixed")}</SelectItem>
            <SelectItem value="local">{t("local")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">{t("Overlay")}</label>
        <OverlayPicker
          value={component.backgroundOverlay ?? undefined}
          onChange={(val) => onChange({ backgroundOverlay: val || undefined })}
        />
      </div>
    </>
  );
}

interface BackgroundVideoSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function BackgroundVideoSection({ component, onChange, t }: BackgroundVideoSectionProps) {
  return (
    <>
      <Input
        label={t("Background video URL")}
        value={component.backgroundVideoUrl ?? ""}
        onChange={(e) => onChange({ backgroundVideoUrl: e.target.value || undefined })}
        placeholder={t("cms.builder.section.videoUrl.placeholder")}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label={t("Poster")}
          value={component.backgroundVideoPoster ?? ""}
          onChange={(e) => onChange({ backgroundVideoPoster: e.target.value || undefined })}
        />
        <Select
          value={
            (component.backgroundVideoLoop ?? undefined) === undefined
              ? ""
              : component.backgroundVideoLoop
                ? "1"
                : "0"
          }
          onValueChange={(v) =>
            onChange({
              backgroundVideoLoop: v === "__default__" ? undefined : v === "" ? undefined : v === "1",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Loop")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">{t("Default")}</SelectItem>
            <SelectItem value="1">{t("true")}</SelectItem>
            <SelectItem value="0">{t("false")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={
            (component.backgroundVideoMuted ?? undefined) === undefined
              ? ""
              : component.backgroundVideoMuted
                ? "1"
                : "0"
          }
          onValueChange={(v) =>
            onChange({
              backgroundVideoMuted: v === "__default__" ? undefined : v === "" ? undefined : v === "1",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Muted")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">{t("Default")}</SelectItem>
            <SelectItem value="1">{t("true")}</SelectItem>
            <SelectItem value="0">{t("false")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

interface ParallaxSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function ParallaxSection({ component, onChange, t }: ParallaxSectionProps) {
  return (
    <Input
      label={t("Parallax")}
      type="number"
      step="0.05"
      min="-5"
      max="5"
      value={component.sectionParallax ?? ""}
      onChange={(e) =>
        onChange({ sectionParallax: e.target.value === "" ? undefined : Number(e.target.value) })
      }
      placeholder={t("0.2")}
    />
  );
}

interface EqualizeSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function EqualizeSection({ component, onChange, t }: EqualizeSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant={component.equalizeInnerHeights ? "default" : "outline"}
        onClick={() => onChange({ equalizeInnerHeights: !component.equalizeInnerHeights })}
        title={t("Make inner children share equal heights (grid auto-rows: 1fr)")}
      >
        {t("Equalize inner heights")}
      </Button>
    </div>
  );
}

interface ShapeSectionProps {
  component: SectionExtra;
  onChange: (patch: Partial<SectionExtra>) => void;
  t: (s: string) => string;
}

function ShapeSection({ component, onChange, t }: ShapeSectionProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">{t("Top shape")}</label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={component.topShapePreset ?? ""}
            onValueChange={(v) =>
              onChange({ topShapePreset: (v || undefined) as SectionExtra["topShapePreset"] | undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Preset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wave">{t("wave")}</SelectItem>
              <SelectItem value="tilt">{t("tilt")}</SelectItem>
              <SelectItem value="curve">{t("curve")}</SelectItem>
              <SelectItem value="mountain">{t("mountain")}</SelectItem>
              <SelectItem value="triangle">{t("triangle")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            label={t("Color")}
            value={component.topShapeColor ?? ""}
            onChange={(e) => onChange({ topShapeColor: e.target.value || undefined })}
            placeholder="var(--token)"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={t("Height (px)")}
            type="number"
            min="0"
            value={component.topShapeHeight ?? ""}
            onChange={(e) =>
              onChange({ topShapeHeight: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
          <Select
            value={(component.topShapeFlipX ?? undefined) === undefined ? "" : component.topShapeFlipX ? "1" : "0"}
            onValueChange={(v) =>
              onChange({ topShapeFlipX: v === "__default__" ? undefined : v === "" ? undefined : v === "1" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Flip X")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">{t("default")}</SelectItem>
              <SelectItem value="1">{t("true")}</SelectItem>
              <SelectItem value="0">{t("false")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">{t("Bottom shape")}</label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={component.bottomShapePreset ?? ""}
            onValueChange={(v) =>
              onChange({ bottomShapePreset: (v || undefined) as SectionExtra["bottomShapePreset"] | undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Preset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wave">{t("wave")}</SelectItem>
              <SelectItem value="tilt">{t("tilt")}</SelectItem>
              <SelectItem value="curve">{t("curve")}</SelectItem>
              <SelectItem value="mountain">{t("mountain")}</SelectItem>
              <SelectItem value="triangle">{t("triangle")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            label={t("Color")}
            value={component.bottomShapeColor ?? ""}
            onChange={(e) => onChange({ bottomShapeColor: e.target.value || undefined })}
            placeholder="var(--token)"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={t("Height (px)")}
            type="number"
            min="0"
            value={component.bottomShapeHeight ?? ""}
            onChange={(e) =>
              onChange({ bottomShapeHeight: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
          <Select
            value={
              (component.bottomShapeFlipX ?? undefined) === undefined ? "" : component.bottomShapeFlipX ? "1" : "0"
            }
            onValueChange={(v) =>
              onChange({ bottomShapeFlipX: v === "__default__" ? undefined : v === "" ? undefined : v === "1" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Flip X")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">{t("default")}</SelectItem>
              <SelectItem value="1">{t("true")}</SelectItem>
              <SelectItem value="0">{t("false")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

interface ImageEditorSectionProps {
  open: boolean;
  onClose: () => void;
  component: SectionExtra;
  editState: ImageEditState;
  initialFilter: string | undefined;
  onChange: (patch: Partial<SectionExtra>) => void;
  onApplyFilter: (filter: string | undefined) => void;
}

function ImageEditorSection({
  open,
  onClose,
  component,
  editState,
  initialFilter,
  onChange,
  onApplyFilter,
}: ImageEditorSectionProps) {
  if (!open || !component.backgroundImageUrl) return null;
  return (
    <ImageEditor
      open={open}
      src={component.backgroundImageUrl}
      initial={editState}
      initialFilter={initialFilter}
      onClose={onClose}
      onApply={(next) => {
        onChange({ backgroundFocalPoint: next.focalPoint || { x: 0.5, y: 0.5 } });
      }}
      onApplyFilter={onApplyFilter}
    />
  );
}

export default function SectionEditor({ component, onChange }: Props) {
  // i18n-exempt — internal editor labels
  /* i18n-exempt */
  const t = (s: string) => s;
  const [imgEditorOpen, setImgEditorOpen] = useState(false);
  const previewTokens = usePreviewTokens();
  const textThemes = extractTextThemes(previewTokens);
  const editState = useMemo<ImageEditState>(() => ({
    cropAspect: undefined,
    focalPoint: component.backgroundFocalPoint ?? { x: 0.5, y: 0.5 },
  }), [component.backgroundFocalPoint]);
  const { initialFilter, applyFilter } = useFilterValue(component, onChange);

  return (
    <div className="space-y-2">
      {/* Section typography + height */}
      <div className="grid grid-cols-2 gap-2">
        <TextThemeSection component={component} textThemes={textThemes} onChange={onChange} t={t} />
        <HeightSection component={component} onChange={onChange} t={t} />
      </div>
      <MinHeightSection component={component} onChange={onChange} t={t} />
      {/* Background image */}
      <BackgroundImageSection
        component={component}
        onChange={onChange}
        onOpenEditor={() => setImgEditorOpen(true)}
        t={t}
      />

      {/* Background video */}
      <BackgroundVideoSection component={component} onChange={onChange} t={t} />

      {/* Section parallax */}
      <ParallaxSection component={component} onChange={onChange} t={t} />

      {/* Inner layout helpers */}
      <EqualizeSection component={component} onChange={onChange} t={t} />

      {/* Shape dividers */}
      <ShapeSection component={component} onChange={onChange} t={t} />

      <ImageEditorSection
        open={imgEditorOpen}
        onClose={() => setImgEditorOpen(false)}
        component={component}
        editState={editState}
        initialFilter={initialFilter}
        onChange={onChange}
        onApplyFilter={applyFilter}
      />
    </div>
  );
}
