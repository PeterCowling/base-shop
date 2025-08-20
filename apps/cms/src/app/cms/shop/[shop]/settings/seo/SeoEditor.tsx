"use client";
import { Button, Input, Textarea } from "@/components/atoms/shadcn";
import { setFreezeTranslations, updateSeo } from "@cms/actions/shops.server";
import type { Locale } from "@acme/types";
import { ChangeEvent, FormEvent, useState } from "react";

interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
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
  const [alt, setAlt] = useState(initialSeo[locale]?.alt ?? "");
  const [canonicalBase, setCanonicalBase] = useState(
    initialSeo[locale]?.canonicalBase ?? ""
  );
  const [ogUrl, setOgUrl] = useState(initialSeo[locale]?.ogUrl ?? "");
  const [twitterCard, setTwitterCard] = useState(
    initialSeo[locale]?.twitterCard ?? ""
    );
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [warnings, setWarnings] = useState<string[]>([]);
    const [freeze, setFreeze] = useState(initialFreeze);

  const handleLocaleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const l = e.target.value as Locale;
    setLocale(l);
    setCanonicalBase(initialSeo[l]?.canonicalBase ?? "");
    if (!freeze) {
      setTitle(initialSeo[l]?.title ?? "");
      setDescription(initialSeo[l]?.description ?? "");
      setImage(initialSeo[l]?.image ?? "");
      setAlt(initialSeo[l]?.alt ?? "");
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
    fd.append("alt", alt);
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

    const handleGenerate = async () => {
      setGenerating(true);
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          id: `${shop}-${locale}`,
          title,
          description,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title: string;
          description: string;
          alt: string;
          image: string;
        };
        setTitle(data.title);
        setDescription(data.description);
        setAlt(data.alt);
        setImage(data.image);
      }
      setGenerating(false);
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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Description</span>
        <Textarea
          rows={3}
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Image URL</span>
        <Input
          className="border p-2"
          value={image}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setImage(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Image Alt</span>
        <Input
          className="border p-2"
          value={alt}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAlt(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Canonical Base</span>
        <Input
          className="border p-2"
          value={canonicalBase}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setCanonicalBase(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Open Graph URL</span>
        <Input
          className="border p-2"
          value={ogUrl}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setOgUrl(e.target.value)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Twitter Card</span>
        <Input
          className="border p-2"
          value={twitterCard}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTwitterCard(e.target.value)
          }
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
        <div className="flex gap-2">
          <Button
            className="bg-muted text-primary"
            type="button"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate metadata"}
          </Button>
          <Button className="bg-primary text-white" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    );
  }
