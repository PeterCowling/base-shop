"use client";

import { useTranslations } from "@acme/i18n";
import { memo, useCallback, useEffect, useState } from "react";
import { Button, Input, Checkbox } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
import useRemoteImageProbe from "@ui/hooks/useRemoteImageProbe";

interface Props {
  src?: string;
  alt?: string;
  onSrcChange: (src: string) => void;
  onAltChange: (alt: string) => void;
}

function ImageSourcePanel({ src, alt, onSrcChange, onAltChange }: Props) {
  const t = useTranslations();
  const [url, setUrl] = useState(src ?? "");
  const [decorative, setDecorative] = useState(false);
  const { status, error, probe } = useRemoteImageProbe();

  useEffect(() => {
    setUrl(src ?? "");
  }, [src]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
    },
    [],
  );

  const handleUrlBlur = useCallback(() => {
    if (!url) return;
    void probe(url).then((ok) => {
      if (ok) onSrcChange(url);
    });
  }, [url, probe, onSrcChange]);

  const handleAltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onAltChange(value);
      if (value) setDecorative(false);
    },
    [onAltChange],
  );

  const handleDecorative = useCallback(
    (checked: boolean) => {
      setDecorative(checked);
      if (checked) onAltChange("");
    },
    [onAltChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={url}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          placeholder={t("builder.image.url")}
          className="flex-1"
        />
        <ImagePicker
          onSelect={(u) => {
            setUrl(u);
            onSrcChange(u);
          }}
        >
          <Button type="button" variant="outline">
            {t("builder.image.upload")}
          </Button>
        </ImagePicker>
      </div>
      {status === "loading" && (
        <p className="text-sm">{t("builder.image.probing")}</p>
      )}
      {status === "invalid" && (
        <p className="text-sm text-danger" data-token="--color-danger">
          {t("builder.image.invalid")}
        </p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-danger" data-token="--color-danger">
          {error}
        </p>
      )}
      <Input
        value={alt ?? ""}
        onChange={handleAltChange}
        placeholder={t("builder.image.alt")}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={decorative}
          onCheckedChange={(c) => handleDecorative(Boolean(c))}
        />
        {t("builder.image.decorative")}
      </label>
      {!decorative && !(alt && alt.length > 0) && (
        <p className="text-sm text-warning" data-token="--color-warning">
          {t("builder.image.altWarning")}
        </p>
      )}
    </div>
  );
}

export default memo(ImageSourcePanel);
