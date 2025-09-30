// packages/ui/src/components/cms/page-builder/SectionEditor.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { useCallback, useMemo, useState } from "react";
import ImageEditor, { type ImageEditState } from "./ImageEditor";
import OverlayPicker from "./OverlayPicker";
import type { EditorProps } from "./EditorProps";
import usePreviewTokens from "./hooks/usePreviewTokens";
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

  const handle = useCallback(<K extends keyof SectionExtra>(field: K, value: SectionExtra[K]) => {
    onChange({ [field]: value } as Partial<SectionExtra>);
  }, [onChange]);

  const initialFilter = (() => {
    try {
      const raw = component.styles as string | undefined;
      if (!raw) return undefined;
      const parsed = JSON.parse(String(raw)) as { effects?: { filter?: string } };
      return parsed?.effects?.filter;
    } catch {
      return undefined;
    }
  })();

  const applyFilter = useCallback((filter: string | undefined) => {
    try {
      const raw = component.styles as string | undefined;
      const base = raw ? (JSON.parse(String(raw)) as Record<string, unknown>) : {};
      const next = { ...base, effects: { ...(base.effects ?? {}), filter } };
      handle("styles", JSON.stringify(next));
    } catch {
      const next = { effects: { filter } };
      handle("styles", JSON.stringify(next));
    }
  }, [component, handle]);

  return (
    <div className="space-y-2">
      {/* Section typography + height */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={component.textTheme ?? ""}
          onValueChange={(v) => handle("textTheme", (v || undefined) as string | undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Text theme")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("Default")}</SelectItem>
            {textThemes.map((t: TextTheme) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={component.heightPreset ?? ""}
          onValueChange={(v) => handle("heightPreset", (v || undefined) as SectionExtra["heightPreset"] | undefined)}
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
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input
          label={t("Min height")}
          placeholder={t("e.g. 480px or 80svh")}
          value={component.minHeight ?? ""}
          onChange={(e) => handle("minHeight", (e.target.value || undefined))}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => handle("minHeight", "100svh")}
          title={t("Set full viewport height")}
        >{t("Full (100svh)")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handle("minHeight", undefined)}
          title={t("Clear minimum height")}
        >{t("Clear min")}</Button>
      </div>
      {/* Background image */}
      <div className="flex items-start gap-2">
        <Input
          label={t("Background image URL")}
          value={component.backgroundImageUrl ?? ""}
          onChange={(e) => handle("backgroundImageUrl", (e.target.value || undefined))}
          placeholder="https://..."
        />
        <Button type="button" variant="outline" disabled={!((component.backgroundImageUrl ?? ""))} onClick={() => setImgEditorOpen(true)}>
          {t("Focal")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={component.backgroundSize ?? ""}
          onValueChange={(v) => handle("backgroundSize", (v || undefined) as SectionExtra["backgroundSize"] | undefined)}
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
          onValueChange={(v) => handle("backgroundRepeat", (v || undefined) as SectionExtra["backgroundRepeat"] | undefined)}
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
          onValueChange={(v) => handle("backgroundAttachment", (v || undefined) as SectionExtra["backgroundAttachment"] | undefined)}
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
          onChange={(val) => handle("backgroundOverlay", (val || undefined))}
        />
      </div>

      {/* Background video */}
      <Input
        label={t("Background video URL")}
        value={component.backgroundVideoUrl ?? ""}
        onChange={(e) => handle("backgroundVideoUrl", (e.target.value || undefined))}
        placeholder={t("cms.builder.section.videoUrl.placeholder")}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label={t("Poster")}
          value={component.backgroundVideoPoster ?? ""}
          onChange={(e) => handle("backgroundVideoPoster", (e.target.value || undefined))}
        />
        <Select
          value={(component.backgroundVideoLoop ?? undefined) === undefined ? "" : (component.backgroundVideoLoop ? "1" : "0")}
          onValueChange={(v) => handle("backgroundVideoLoop", v === "__default__" ? undefined : (v === "" ? undefined : v === "1"))}
        >
          <SelectTrigger><SelectValue placeholder={t("Loop")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">{t("Default")}</SelectItem>
            <SelectItem value="1">{t("true")}</SelectItem>
            <SelectItem value="0">{t("false")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(component.backgroundVideoMuted ?? undefined) === undefined ? "" : (component.backgroundVideoMuted ? "1" : "0")}
          onValueChange={(v) => handle("backgroundVideoMuted", v === "__default__" ? undefined : (v === "" ? undefined : v === "1"))}
        >
          <SelectTrigger><SelectValue placeholder={t("Muted")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">{t("Default")}</SelectItem>
            <SelectItem value="1">{t("true")}</SelectItem>
            <SelectItem value="0">{t("false")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Section parallax */}
      <Input
        label={t("Parallax")}
        type="number"
        step="0.05"
        min="-5"
        max="5"
        value={component.sectionParallax ?? ""}
        onChange={(e) => handle("sectionParallax", (e.target.value === "" ? undefined : Number(e.target.value)))}
        placeholder={t("0.2")}
      />

      {/* Inner layout helpers */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={component.equalizeInnerHeights ? "default" : "outline"}
          onClick={() => handle("equalizeInnerHeights", !component.equalizeInnerHeights)}
          title={t("Make inner children share equal heights (grid auto-rows: 1fr)")}
        >
          {t("Equalize inner heights")}
        </Button>
      </div>

      {/* Shape dividers */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">{t("Top shape")}</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={component.topShapePreset ?? ""}
              onValueChange={(v) => handle("topShapePreset", (v || undefined) as SectionExtra["topShapePreset"] | undefined)}
            >
              <SelectTrigger><SelectValue placeholder={t("Preset")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">{t("wave")}</SelectItem>
                <SelectItem value="tilt">{t("tilt")}</SelectItem>
                <SelectItem value="curve">{t("curve")}</SelectItem>
                <SelectItem value="mountain">{t("mountain")}</SelectItem>
                <SelectItem value="triangle">{t("triangle")}</SelectItem>
              </SelectContent>
            </Select>
            <Input label={t("Color")} value={component.topShapeColor ?? ""} onChange={(e) => handle("topShapeColor", (e.target.value || undefined))} placeholder="var(--token)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label={t("Height (px)")} type="number" min="0" value={component.topShapeHeight ?? ""} onChange={(e) => handle("topShapeHeight", (e.target.value === "" ? undefined : Number(e.target.value)))} />
            <Select
              value={(component.topShapeFlipX ?? undefined) === undefined ? "" : (component.topShapeFlipX ? "1" : "0")}
              onValueChange={(v) => handle("topShapeFlipX", v === "__default__" ? undefined : (v === "" ? undefined : v === "1"))}
            >
              <SelectTrigger><SelectValue placeholder={t("Flip X")} /></SelectTrigger>
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
              onValueChange={(v) => handle("bottomShapePreset", (v || undefined) as SectionExtra["bottomShapePreset"] | undefined)}
            >
              <SelectTrigger><SelectValue placeholder={t("Preset")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">{t("wave")}</SelectItem>
                <SelectItem value="tilt">{t("tilt")}</SelectItem>
                <SelectItem value="curve">{t("curve")}</SelectItem>
                <SelectItem value="mountain">{t("mountain")}</SelectItem>
                <SelectItem value="triangle">{t("triangle")}</SelectItem>
              </SelectContent>
            </Select>
            <Input label={t("Color")} value={component.bottomShapeColor ?? ""} onChange={(e) => handle("bottomShapeColor", (e.target.value || undefined))} placeholder="var(--token)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label={t("Height (px)")} type="number" min="0" value={component.bottomShapeHeight ?? ""} onChange={(e) => handle("bottomShapeHeight", (e.target.value === "" ? undefined : Number(e.target.value)))} />
            <Select
              value={(component.bottomShapeFlipX ?? undefined) === undefined ? "" : (component.bottomShapeFlipX ? "1" : "0")}
              onValueChange={(v) => handle("bottomShapeFlipX", v === "__default__" ? undefined : (v === "" ? undefined : v === "1"))}
            >
              <SelectTrigger><SelectValue placeholder={t("Flip X")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">{t("default")}</SelectItem>
                <SelectItem value="1">{t("true")}</SelectItem>
                <SelectItem value="0">{t("false")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {imgEditorOpen && component.backgroundImageUrl ? (
        <ImageEditor
          open={imgEditorOpen}
          src={component.backgroundImageUrl}
          initial={editState}
          initialFilter={initialFilter}
          onClose={() => setImgEditorOpen(false)}
          onApply={(next) => {
            handle("backgroundFocalPoint", next.focalPoint || { x: 0.5, y: 0.5 });
          }}
          onApplyFilter={applyFilter}
        />
      ) : null}
    </div>
  );
}
