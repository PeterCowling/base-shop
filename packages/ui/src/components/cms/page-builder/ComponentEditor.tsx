// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import { getShopFromPath } from "@platform-core/src/utils/getShopFromPath";
import type { MediaItem, PageComponent } from "@types";
import useMediaUpload from "@ui/hooks/useMediaUpload";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms-shadcn";

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
}

function ComponentEditor({ component, onChange }: Props) {
  /* ─────────── hooks ─────────── */
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  /* ─────────── media helpers ─────────── */
  const loadMedia = useCallback(async () => {
    if (!shop) return;
    try {
      const res = await fetch(`/cms/api/media?shop=${shop}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMedia(data);
      }
    } catch {
      /* silent */
    }
  }, [shop]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  /* ─────────── reusable image-picker ─────────── */
  const ImagePicker = memo(
    ({
      onSelect,
      children,
    }: {
      onSelect: (url: string) => void;
      children: React.ReactNode;
    }) => {
      const [open, setOpen] = useState(false);

      const {
        pendingFile,
        altText,
        setAltText,
        isValid,
        actual,
        inputRef,
        onFileChange,
        handleUpload,
        error,
      } = useMediaUpload({
        shop: shop ?? "",
        requiredOrientation: "landscape",
        onUploaded: (item: MediaItem) => {
          setMedia((m) => [item, ...m]);
        },
      });

      useEffect(() => {
        if (open) void loadMedia();
      }, [open, loadMedia]);

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="max-w-xl space-y-4">
            <DialogTitle>Select image</DialogTitle>

            {/* file picker + upload */}
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="flex-1"
              />
              {pendingFile && isValid && (
                <Button type="button" onClick={handleUpload}>
                  Upload
                </Button>
              )}
            </div>

            {/* alt-text input */}
            {pendingFile && isValid && (
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Alt text"
              />
            )}

            {/* orientation check message */}
            {pendingFile && isValid !== null && (
              <p className="text-sm">
                {isValid
                  ? `Image orientation is ${actual}`
                  : `Selected image is ${actual}; please upload a landscape image.`}
              </p>
            )}

            {/* upload error */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* media grid */}
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
              {media.map((m) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => {
                    onSelect(m.url);
                    setOpen(false);
                  }}
                  className="relative aspect-square"
                >
                  <Image
                    src={m.url}
                    alt={m.altText || "media"}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
              {media.length === 0 && (
                <p className="text-muted-foreground col-span-3 text-sm">
                  No media found.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  );
  ImagePicker.displayName = "ImagePicker";

  /* ─────────── guard ─────────── */
  if (!component) return null;

  /* ─────────── generic helpers ─────────── */
  const handleInput = useCallback(
    (field: string, value: string | number | undefined) => {
      onChange({ [field]: value } as Partial<PageComponent>);
    },
    [onChange]
  );

  /**
   * Utility for editing array-of-objects props
   * (e.g. `slides`, `testimonials`, …).
   */
  const arrayEditor = useCallback(
    (prop: string, items: unknown[] | undefined, fields: string[]) => {
      const list = (items ?? []) as Record<string, unknown>[];
      return (
        <div className="space-y-2">
          {list.map((item, idx) => (
            <div key={idx} className="space-y-1 rounded border p-2">
              {fields.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Input
                    value={(item[f] as string) ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const next = [...list];
                      next[idx] = { ...next[idx], [f]: e.target.value };
                      onChange({ [prop]: next } as Partial<PageComponent>);
                    }}
                    placeholder={f}
                    className="flex-1"
                  />
                  {f === "src" && (
                    <ImagePicker
                      onSelect={(url) => {
                        const next = [...list];
                        next[idx] = { ...next[idx], src: url };
                        onChange({ [prop]: next } as Partial<PageComponent>);
                      }}
                    >
                      <Button type="button" variant="outline">
                        Pick
                      </Button>
                    </ImagePicker>
                  )}
                </div>
              ))}
              <Button
                variant="destructive"
                onClick={() => {
                  const next = list.filter((_, i) => i !== idx);
                  onChange({ [prop]: next } as Partial<PageComponent>);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            onClick={() => {
              const blank = Object.fromEntries(fields.map((f) => [f, ""]));
              onChange({ [prop]: [...list, blank] } as Partial<PageComponent>);
            }}
          >
            Add
          </Button>
        </div>
      );
    },
    [onChange]
  );

  /* ─────────── per‑component editors ─────────── */
  let specific: React.ReactNode = null;

  switch (component.type) {
    case "ContactForm":
      specific = (
        <div className="space-y-2">
          <Input
            label="Action"
            value={(component as any).action ?? ""}
            onChange={(e) => handleInput("action", e.target.value)}
          />
          <Input
            label="Method"
            value={(component as any).method ?? ""}
            onChange={(e) => handleInput("method", e.target.value)}
          />
        </div>
      );
      break;

    case "Gallery":
      specific = arrayEditor("images", (component as any).images, [
        "src",
        "alt",
      ]);
      break;

    case "Image":
      specific = (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Input
              value={(component as any).src ?? ""}
              onChange={(e) => handleInput("src", e.target.value)}
              placeholder="src"
              className="flex-1"
            />
            <ImagePicker onSelect={(url) => handleInput("src", url)}>
              <Button type="button" variant="outline">
                Pick
              </Button>
            </ImagePicker>
          </div>
          <Input
            value={(component as any).alt ?? ""}
            onChange={(e) => handleInput("alt", e.target.value)}
            placeholder="alt"
          />
        </div>
      );
      break;

    case "Testimonials":
      specific = arrayEditor("testimonials", (component as any).testimonials, [
        "quote",
        "name",
      ]);
      break;

    case "HeroBanner":
      specific = arrayEditor("slides", (component as any).slides, [
        "src",
        "alt",
        "headlineKey",
        "ctaKey",
      ]);
      break;

    case "ValueProps":
      specific = arrayEditor("items", (component as any).items, [
        "icon",
        "title",
        "desc",
      ]);
      break;

    case "ReviewsCarousel":
      specific = arrayEditor("reviews", (component as any).reviews, [
        "nameKey",
        "quoteKey",
      ]);
      break;

    default:
      specific = <p className="text-sm text-gray-500">No editable props</p>;
  }

  /* ─────────── generic property editors ─────────── */
  return (
    <div className="space-y-2">
      <Input
        label="Width"
        value={component.width ?? ""}
        onChange={(e) => handleInput("width", e.target.value)}
      />
      <Input
        label="Height"
        value={component.height ?? ""}
        onChange={(e) => handleInput("height", e.target.value)}
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
