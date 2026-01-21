"use client";
import React from "react";

import type { ImageSliderComponent } from "@acme/types";

import { Button, Checkbox,Input } from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";
import ImagePicker from "./ImagePicker";

// i18n-exempt — editor-only labels and placeholders
const t = (s: string) => s;

type Props = EditorProps<ImageSliderComponent>;

export default function ImageSliderEditor({ component, onChange }: Props) {
  const slides: NonNullable<ImageSliderComponent["slides"]> = component.slides ?? [];
  const min = component.minItems ?? 0;
  const max = component.maxItems ?? Infinity;
  // Maintain stable React keys per slide position without using array index
  const keysRef = React.useRef<string[]>([]);
  const newKey = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

  // Ensure keys array matches slides length for external changes
  React.useEffect(() => {
    const keys = keysRef.current;
    if (keys.length < slides.length) {
      while (keys.length < slides.length) keys.push(newKey());
    } else if (keys.length > slides.length) {
      keys.splice(slides.length);
    }
  }, [slides.length]);

  const update = (idx: number, field: string, value: string) => {
    const next = [...slides];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ slides: next } as Partial<ImageSliderComponent>);
  };

  const move = (from: number, to: number) => {
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ slides: next } as Partial<ImageSliderComponent>);
    // mirror key movement
    const k = keysRef.current.splice(from, 1)[0];
    keysRef.current.splice(to, 0, k);
  };

  const remove = (idx: number) => {
    const next = slides.filter((_: unknown, i: number) => i !== idx);
    onChange({ slides: next } as Partial<ImageSliderComponent>);
    keysRef.current.splice(idx, 1);
  };

  const add = () => {
    onChange({ slides: [...slides, { src: "", alt: "", caption: "" }] } as Partial<ImageSliderComponent>);
    keysRef.current.push(newKey());
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={!!component.openInLightbox}
          onCheckedChange={(v) => onChange({ openInLightbox: !!v } as Partial<ImageSliderComponent>)}
        />
        {t("Open images in lightbox")}
      </label>
      {slides.map((s: NonNullable<ImageSliderComponent["slides"]>[number], idx: number) => (
        <div key={keysRef.current[idx] ?? (keysRef.current[idx] = newKey())} className="space-y-1 rounded border p-2">
          <div className="flex items-start gap-2">
            <Input
              value={s.src ?? ""}
              onChange={(e) => update(idx, "src", e.target.value)}
              placeholder={t("src")}
              className="flex-1"
            />
            <ImagePicker onSelect={(url) => update(idx, "src", url)}>
              <Button type="button" variant="outline">{t("Pick")}</Button>
            </ImagePicker>
          </div>
          <Input
            value={s.alt ?? ""}
            onChange={(e) => update(idx, "alt", e.target.value)}
            placeholder={t("alt")}
          />
          <Input
            value={s.caption ?? ""}
            onChange={(e) => update(idx, "caption", e.target.value)}
            placeholder={t("caption")}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => move(idx, idx - 1)} disabled={idx === 0}>
              {t("Up")}
            </Button>
            <Button
              type="button"
              onClick={() => move(idx, idx + 1)}
              disabled={idx === slides.length - 1}
            >
              {t("Down")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(idx)}
              disabled={slides.length <= min}
            >
              {t("Remove")}
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={add} disabled={slides.length >= max}>
        {t("Add")}
      </Button>
    </div>
  );
}
