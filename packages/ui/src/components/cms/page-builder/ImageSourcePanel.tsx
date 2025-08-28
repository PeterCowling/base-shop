"use client";
import type { ImageComponent } from "@acme/types";
import { memo, useCallback, useState } from "react";
import { Button, Input, Checkbox } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
import { useRemoteImageProbe } from "@ui/hooks/useRemoteImageProbe";

interface Props {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponent>) => void;
}

function ImageSourcePanel({ component, onChange }: Props) {
  const [url, setUrl] = useState(component.src ?? "");
  const [alt, setAlt] = useState(component.alt ?? "");
  const [decorative, setDecorative] = useState(!component.alt);
  const { probe, loading, error } = useRemoteImageProbe();

  const applyUrl = useCallback(async () => {
    if (!url) {
      onChange({ src: "" });
      return;
    }
    const ok = await probe(url);
    if (ok) onChange({ src: url });
  }, [url, probe, onChange]);

  const handleUrlBlur = useCallback(() => {
    void applyUrl();
  }, [applyUrl]);

  const handleAlt = useCallback(
    (value: string) => {
      setAlt(value);
      onChange({ alt: value });
    },
    [onChange]
  );

  const handleDecorative = useCallback(
    (checked: boolean) => {
      setDecorative(checked);
      if (checked) {
        setAlt("");
        onChange({ alt: "" });
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="Image URL"
          className="flex-1"
        />
        <ImagePicker onSelect={(u) => { setUrl(u); onChange({ src: u }); }}>
          <Button type="button" variant="outline">
            Upload
          </Button>
        </ImagePicker>
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground">Checking…</p>
      )}
      {error && (
        <p className="text-sm text-danger" data-token="--color-danger">
          {error}
        </p>
      )}
      <Input
        value={alt}
        onChange={(e) => handleAlt(e.target.value)}
        placeholder="Alt text"
        disabled={decorative}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="decorative"
          checked={decorative}
          onCheckedChange={(c) => handleDecorative(!!c)}
        />
        <label htmlFor="decorative" className="text-sm">
          Decorative
        </label>
      </div>
      {!decorative && alt.trim() === "" && (
        <p
          className="text-sm text-warning"
          data-token="--color-warning"
        >
          Alt text is recommended unless decorative.
        </p>
      )}
    </div>
  );
}

export default memo(ImageSourcePanel);
