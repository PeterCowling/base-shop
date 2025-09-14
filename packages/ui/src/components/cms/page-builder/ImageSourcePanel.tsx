// packages/ui/src/components/cms/page-builder/ImageSourcePanel.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import { useCallback, useEffect, useState, memo } from "react";
import { Button, Checkbox, Input } from "../../atoms/shadcn";
import useRemoteImageProbe from "../../../hooks/useRemoteImageProbe";
import ImagePicker from "./ImagePicker";

interface Props {
  src?: string;
  alt?: string;
  onChange: (patch: { src?: string; alt?: string }) => void;
}

function ImageSourcePanel({ src, alt, onChange }: Props) {
  const t = useTranslations();
  const [url, setUrl] = useState(src ?? "");
  const [altText, setAltText] = useState(alt ?? "");
  const [decorative, setDecorative] = useState(false);
  const { probe, loading, error, valid } = useRemoteImageProbe();

  useEffect(() => {
    setUrl(src ?? "");
  }, [src]);

  useEffect(() => {
    setAltText(alt ?? "");
  }, [alt]);

  useEffect(() => {
    if (url) {
      probe(url);
    }
  }, [url, probe]);

  const handleUrl = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUrl(value);
      onChange({ src: value });
    },
    [onChange]
  );

  const handleAlt = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAltText(value);
      onChange({ alt: value });
    },
    [onChange]
  );

  const handleDecorative = useCallback(
    (checked: boolean) => {
      setDecorative(!!checked);
      const value = checked ? "" : altText;
      setAltText(value);
      onChange({ alt: value });
    },
    [altText, onChange]
  );

  const handleSelect = useCallback(
    (url: string) => {
      setUrl(url);
      onChange({ src: url });
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={url}
          onChange={handleUrl}
          placeholder={t("cms.image.url") as string}
          className="flex-1"
        />
        <ImagePicker onSelect={handleSelect}>
          <Button type="button" variant="outline">
            {t("cms.image.upload")}
          </Button>
        </ImagePicker>
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground">{t("cms.image.probing")}</p>
      )}
      {!loading && error && (
        <p className="text-sm text-danger" role="alert">
          {t("cms.image.probeError")}
        </p>
      )}
      <Input
        value={altText}
        onChange={handleAlt}
        placeholder={t("cms.image.alt") as string}
        disabled={decorative}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={decorative} onCheckedChange={handleDecorative} />
        {t("cms.image.decorative")}
      </label>
      {!decorative && altText.trim() === "" && (
        <p className="text-warning text-sm" role="alert">
          {t("cms.image.altWarning")}
        </p>
      )}
      {valid === false && !error && (
        <p className="text-warning text-sm" role="alert">
          {t("cms.image.probeError")}
        </p>
      )}
    </div>
  );
}

export default memo(ImageSourcePanel);
