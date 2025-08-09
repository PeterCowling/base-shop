"use client";
import { Button, Input, Textarea } from "@/components/atoms/shadcn";
import { setFreezeTranslations, updateSeo } from "@cms/actions/shops.server";
import type { Locale } from "@types";
import { ChangeEvent, FormEvent, useState } from "react";

interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  canonicalBase?: string;
  ogUrl?: string;
  twitterCard?: string;
}

interface Props {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Partial<Record<string, SeoData>>;
  initialFreeze?: boolean;
}

export default function SeoEditor({
  shop,
  languages,
  initialSeo,
  initialFreeze = false,
}: Props) {
  const [locale, setLocale] = useState<Locale>(languages[0]);
  const [title, setTitle] = useState(initialSeo[locale]?.title ?? "");
  const [description, setDescription] = useState(
    initialSeo[locale]?.description ?? ""
  );
  const [image, setImage] = useState(initialSeo[locale]?.image ?? "");
  const [canonicalBase, setCanonicalBase] = useState(
    initialSeo[locale]?.canonicalBase ?? ""
  );
  const [ogUrl, setOgUrl] = useState(initialSeo[locale]?.ogUrl ?? "");
  const [twitterCard, setTwitterCard] = useState(
    initialSeo[locale]?.twitterCard ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [freeze, setFreeze] = useState(initialFreeze);

  const handleLocaleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const l = e.target.value as Locale;
    setLocale(l);
    if (!freeze) {
      setTitle(initialSeo[l]?.title ?? "");
      setDescription(initialSeo[l]?.description ?? "");
      setImage(initialSeo[l]?.image ?? "");
      setCanonicalBase(initialSeo[l]?.canonicalBase ?? "");
      setOgUrl(initialSeo[l]?.ogUrl ?? "");
      setTwitterCard(initialSeo[l]?.twitterCard ?? "");
    }
    setErrors({});
    setWarnings([]);
  };

  const handleFreezeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFreeze(checked);
    await setFreezeTranslations(shop, checked);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("image", image);
    fd.append("canonicalBase", canonicalBase);
    fd.append("ogUrl", ogUrl);
    fd.append("twitterCard", twitterCard);
    const result = await updateSeo(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
      setWarnings(result.warnings ?? []);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex flex-col gap-1">
        <span>Locale</span>
        <select
          value={locale}
          onChange={handleLocaleChange}
          className="border p-2"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={freeze} onChange={handleFreezeChange} />
        <span>Freeze translations</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>Title</span>
        <Input
          className="border p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Description</span>
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Image URL</span>
        <Input
          className="border p-2"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Canonical Base</span>
        <Input
          className="border p-2"
          value={canonicalBase}
          onChange={(e) => setCanonicalBase(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Open Graph URL</span>
        <Input
          className="border p-2"
          value={ogUrl}
          onChange={(e) => setOgUrl(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Twitter Card</span>
        <Input
          className="border p-2"
          value={twitterCard}
          onChange={(e) => setTwitterCard(e.target.value)}
        />
      </label>
      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-600">
          {Object.entries(errors).map(([k, v]) => (
            <p key={k}>{v.join("; ")}</p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="text-sm text-yellow-700">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}
      <Button className="bg-primary text-white" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
