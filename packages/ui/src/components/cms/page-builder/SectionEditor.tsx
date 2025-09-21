// packages/ui/src/components/cms/page-builder/SectionEditor.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { useCallback, useMemo, useState } from "react";
import ImageEditor, { type ImageEditState } from "./ImageEditor";
import OverlayPicker from "./OverlayPicker";
import type { EditorProps } from "./EditorProps";

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
};
type Props = EditorProps<SectionExtra>;

export default function SectionEditor({ component, onChange }: Props) {
  const [imgEditorOpen, setImgEditorOpen] = useState(false);
  const editState = useMemo<ImageEditState>(() => ({
    cropAspect: undefined,
    focalPoint: component.backgroundFocalPoint ?? { x: 0.5, y: 0.5 },
  }), [component.backgroundFocalPoint]);

  const handle = useCallback(<K extends keyof SectionExtra>(field: K, value: SectionExtra[K]) => {
    onChange({ [field]: value } as Partial<SectionExtra>);
  }, [onChange]);

  const initialFilter = (() => {
    try {
      const raw = (component as any).styles as string | undefined;
      if (!raw) return undefined;
      const parsed = JSON.parse(String(raw)) as { effects?: { filter?: string } };
      return parsed?.effects?.filter;
    } catch {
      return undefined;
    }
  })();

  const applyFilter = useCallback((filter: string | undefined) => {
    try {
      const raw = (component as any).styles as string | undefined;
      const base = raw ? (JSON.parse(String(raw)) as any) : {};
      const next = { ...base, effects: { ...(base.effects ?? {}), filter } };
      handle("styles" as any, JSON.stringify(next) as any);
    } catch {
      const next = { effects: { filter } };
      handle("styles" as any, JSON.stringify(next) as any);
    }
  }, [component, handle]);

  return (
    <div className="space-y-2">
      {/* Background image */}
      <div className="flex items-start gap-2">
        <Input
          label="Background image URL"
          value={(component as any).backgroundImageUrl ?? ""}
          onChange={(e) => handle("backgroundImageUrl" as any, (e.target.value || undefined) as any)}
          placeholder="https://..."
        />
        <Button type="button" variant="outline" disabled={!((component as any).backgroundImageUrl ?? "")} onClick={() => setImgEditorOpen(true)}>
          Focal
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={(component as any).backgroundSize ?? ""}
          onValueChange={(v) => handle("backgroundSize" as any, (v || undefined) as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">cover</SelectItem>
            <SelectItem value="contain">contain</SelectItem>
            <SelectItem value="auto">auto</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(component as any).backgroundRepeat ?? ""}
          onValueChange={(v) => handle("backgroundRepeat" as any, (v || undefined) as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Repeat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-repeat">no-repeat</SelectItem>
            <SelectItem value="repeat">repeat</SelectItem>
            <SelectItem value="repeat-x">repeat-x</SelectItem>
            <SelectItem value="repeat-y">repeat-y</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(component as any).backgroundAttachment ?? ""}
          onValueChange={(v) => handle("backgroundAttachment" as any, (v || undefined) as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Attachment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scroll">scroll</SelectItem>
            <SelectItem value="fixed">fixed</SelectItem>
            <SelectItem value="local">local</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Overlay</label>
        <OverlayPicker
          value={(component as any).backgroundOverlay ?? undefined}
          onChange={(val) => handle("backgroundOverlay" as any, (val || undefined) as any)}
        />
      </div>

      {/* Background video */}
      <Input
        label="Background video URL"
        value={(component as any).backgroundVideoUrl ?? ""}
        onChange={(e) => handle("backgroundVideoUrl" as any, (e.target.value || undefined) as any)}
        placeholder="https://.../video.mp4"
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label="Poster"
          value={(component as any).backgroundVideoPoster ?? ""}
          onChange={(e) => handle("backgroundVideoPoster" as any, (e.target.value || undefined) as any)}
        />
        <Select
          value={(((component as any).backgroundVideoLoop ?? undefined) === undefined) ? "" : (((component as any).backgroundVideoLoop ? "1" : "0"))}
          onValueChange={(v) => handle("backgroundVideoLoop" as any, (v === "__default__" ? undefined : (v === "" ? undefined : (v === "1"))) as any)}
        >
          <SelectTrigger><SelectValue placeholder="Loop" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">Default</SelectItem>
            <SelectItem value="1">true</SelectItem>
            <SelectItem value="0">false</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={(((component as any).backgroundVideoMuted ?? undefined) === undefined) ? "" : (((component as any).backgroundVideoMuted ? "1" : "0"))}
          onValueChange={(v) => handle("backgroundVideoMuted" as any, (v === "__default__" ? undefined : (v === "" ? undefined : (v === "1"))) as any)}
        >
          <SelectTrigger><SelectValue placeholder="Muted" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">Default</SelectItem>
            <SelectItem value="1">true</SelectItem>
            <SelectItem value="0">false</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Section parallax */}
      <Input
        label="Parallax"
        type="number"
        step="0.05"
        min="-5"
        max="5"
        value={((component as any).sectionParallax ?? "") as any}
        onChange={(e) => handle("sectionParallax" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)}
        placeholder="0.2"
      />

      {/* Inner layout helpers */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={(component as any).equalizeInnerHeights ? "default" : "outline"}
          onClick={() => handle("equalizeInnerHeights" as any, !((component as any).equalizeInnerHeights) as any)}
          title="Make inner children share equal heights (grid auto-rows: 1fr)"
        >
          Equalize inner heights
        </Button>
      </div>

      {/* Shape dividers */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Top shape</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={(component as any).topShapePreset ?? ""}
              onValueChange={(v) => handle("topShapePreset" as any, (v || undefined) as any)}
            >
              <SelectTrigger><SelectValue placeholder="Preset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">wave</SelectItem>
                <SelectItem value="tilt">tilt</SelectItem>
                <SelectItem value="curve">curve</SelectItem>
                <SelectItem value="mountain">mountain</SelectItem>
                <SelectItem value="triangle">triangle</SelectItem>
              </SelectContent>
            </Select>
            <Input label="Color" value={(component as any).topShapeColor ?? ""} onChange={(e) => handle("topShapeColor" as any, (e.target.value || undefined) as any)} placeholder="var(--token)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Height (px)" type="number" min="0" value={((component as any).topShapeHeight ?? "") as any} onChange={(e) => handle("topShapeHeight" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
            <Select
              value={(((component as any).topShapeFlipX ?? undefined) === undefined) ? "" : (((component as any).topShapeFlipX ? "1" : "0"))}
              onValueChange={(v) => handle("topShapeFlipX" as any, (v === "__default__" ? undefined : (v === "" ? undefined : (v === "1"))) as any)}
            >
              <SelectTrigger><SelectValue placeholder="Flip X" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">default</SelectItem>
                <SelectItem value="1">true</SelectItem>
                <SelectItem value="0">false</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Bottom shape</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={(component as any).bottomShapePreset ?? ""}
              onValueChange={(v) => handle("bottomShapePreset" as any, (v || undefined) as any)}
            >
              <SelectTrigger><SelectValue placeholder="Preset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">wave</SelectItem>
                <SelectItem value="tilt">tilt</SelectItem>
                <SelectItem value="curve">curve</SelectItem>
                <SelectItem value="mountain">mountain</SelectItem>
                <SelectItem value="triangle">triangle</SelectItem>
              </SelectContent>
            </Select>
            <Input label="Color" value={(component as any).bottomShapeColor ?? ""} onChange={(e) => handle("bottomShapeColor" as any, (e.target.value || undefined) as any)} placeholder="var(--token)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Height (px)" type="number" min="0" value={((component as any).bottomShapeHeight ?? "") as any} onChange={(e) => handle("bottomShapeHeight" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
            <Select
              value={(((component as any).bottomShapeFlipX ?? undefined) === undefined) ? "" : (((component as any).bottomShapeFlipX ? "1" : "0"))}
              onValueChange={(v) => handle("bottomShapeFlipX" as any, (v === "__default__" ? undefined : (v === "" ? undefined : (v === "1"))) as any)}
            >
              <SelectTrigger><SelectValue placeholder="Flip X" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">default</SelectItem>
                <SelectItem value="1">true</SelectItem>
                <SelectItem value="0">false</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {imgEditorOpen && (component as any).backgroundImageUrl ? (
        <ImageEditor
          open={imgEditorOpen}
          src={(component as any).backgroundImageUrl}
          initial={editState}
          initialFilter={initialFilter}
          onClose={() => setImgEditorOpen(false)}
          onApply={(next) => {
            handle("backgroundFocalPoint" as any, (next.focalPoint || { x: 0.5, y: 0.5 }) as any);
          }}
          onApplyFilter={applyFilter}
        />
      ) : null}
    </div>
  );
}
