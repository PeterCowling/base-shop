"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives/Grid";
import { Inline as DSInline } from "@acme/ui/components/atoms/primitives/Inline";
import presetData from "@acme/ui/components/cms/style/presets.json";
import Tokens from "@acme/ui/components/cms/style/Tokens";

import type { TokenMap } from "../../wizard/tokenUtils";

interface Props {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (next: TokenMap) => void;
  /** Optional shared tag filters injected by parent */
  tagFilters?: string[];
  /** Hide the built-in tag filter UI when a shared filter is provided */
  hideTagFilter?: boolean;
  /** Hide the fine-tune token editor section */
  showFineTune?: boolean;
}

type PairPreset = { id: string; name: string; tags?: string[]; tokens: Record<string, string> };

export default function TypographySelector({ tokens, baseTokens, onChange, tagFilters: externalTagFilters, hideTagFilter, showFineTune = true }: Props) {
  const t = useTranslations();
  const pairings = useMemo(() => (presetData as unknown as PairPreset[]).filter((p) => p.id.startsWith("type-")), []);

  const firstFamilyFromStack = useCallback((stack: string | undefined): string | null => {
    if (!stack) return null;
    const m = stack.match(/"([^"]+)"/);
    if (m) return m[1];
    const first = stack.split(",")[0]?.trim();
    if (!first || first.startsWith("var(")) return null;
    return first.replace(/^["']|["']$/g, "");
  }, []);

  const googleFamilies = useMemo(() => {
    const fams = new Set<string>();
    (pairings as PairPreset[]).forEach((p) => {
      Object.values(p.tokens).forEach((v) => {
        const name = firstFamilyFromStack(v);
        if (name) fams.add(name);
      });
    });
    return fams;
  }, [pairings, firstFamilyFromStack]);

  const ensureGoogle = useCallback((name: string | null | undefined) => {
    if (!name) return;
    if (typeof document === "undefined") return;
    const id = `google-font-${name}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  // firstFamilyFromStack moved above to support derived googleFamilies

  const currentBody = tokens["--font-body"] ?? baseTokens["--font-body"] ?? tokens["--font-sans"] ?? baseTokens["--font-sans"] ?? "var(--font-sans)";
  const currentH1 = tokens["--font-heading-1"] ?? baseTokens["--font-heading-1"] ?? currentBody;
  const currentH2 = tokens["--font-heading-2"] ?? baseTokens["--font-heading-2"] ?? currentBody;

  useEffect(() => {
    [currentBody, currentH1, currentH2].forEach((stack) => {
      const name = firstFamilyFromStack(stack);
      if (name && googleFamilies.has(name)) ensureGoogle(name);
    });
  }, [currentBody, currentH1, currentH2, firstFamilyFromStack, ensureGoogle, googleFamilies]);

  const [headingSample, setHeadingSample] = useState<string>(String(t("cms.theme.typography.sampleHeadingDefault")));
  const [bodySample, setBodySample] = useState<string>(String(t("cms.theme.typography.sampleBodyDefault")));
  const [sizeH1, setSizeH1] = useState(36);
  const [sizeH2, setSizeH2] = useState(24);
  const [sizeBody, setSizeBody] = useState(16);

  // For the built-in single-select UI (when used standalone), we keep a local single tag string
  const [tagFilter, setTagFilter] = useState<string>("");
  const allTags = useMemo(() => {
    const t = new Set<string>();
    pairings.forEach((p) => (p.tags || []).forEach((tag) => t.add(tag)));
    return Array.from(t).sort();
  }, [pairings]);
  const filteredPairs = useMemo(() => {
    const active = externalTagFilters && externalTagFilters.length > 0 ? externalTagFilters : (tagFilter ? [tagFilter] : []);
    if (!active || active.length === 0) return pairings;
    return pairings.filter((p) => {
      const tags = p.tags || [];
      return tags.some((t) => active.includes(t));
    });
  }, [pairings, tagFilter, externalTagFilters]);

  // Keep internal state in sync when parent drives the filter
  useEffect(() => {
    // When external filters are provided, we don't manage local state
    // Keep the local dropdown cleared to avoid confusion if shown
    if (externalTagFilters !== undefined) setTagFilter("");
  }, [externalTagFilters]);

  const applyPairing = useCallback(
    (p: PairPreset) => {
      const next = { ...tokens } as Record<string, string>;
      ["--font-body", "--font-heading-1", "--font-heading-2"].forEach((k) => {
        if (p.tokens[k]) next[k] = p.tokens[k];
      });
      Object.values(p.tokens).forEach((v) => {
        const name = firstFamilyFromStack(v);
        if (name && googleFamilies.has(name)) ensureGoogle(name);
      });
      onChange(next as TokenMap);
    },
    [onChange, tokens, ensureGoogle, firstFamilyFromStack, googleFamilies],
  );

  const isPairingSelected = useCallback((p: PairPreset) => {
    const keys = ["--font-body", "--font-heading-1", "--font-heading-2"] as const;
    return keys.every((k) => !p.tokens[k] || (tokens as Record<string, string>)[k] === p.tokens[k]);
  }, [tokens]);

  const fontOnly = useCallback((map: TokenMap) => {
    const out: Record<string, string> = {};
    Object.entries(map as Record<string, string>).forEach(([k, v]) => {
      if (k.startsWith("--font") || k.includes("font-family")) out[k] = v;
    });
    return out as TokenMap;
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t("cms.theme.typography.title")}</h2>
      {/* Current selection preview */}
      <div className="rounded border p-4">
        <div className="mb-3 flex flex-wrap items-end gap-4">
          <label className="text-xs">{t("cms.theme.typography.headingSample")}
            <input className="ms-2 h-8 w-60 rounded border px-2 text-sm" value={headingSample} onChange={(e) => setHeadingSample(e.target.value)} />
          </label>
          <label className="text-xs">{t("cms.theme.typography.bodySample")}
            <input className="ms-2 h-8 w-60 rounded border px-2 text-sm" value={bodySample} onChange={(e) => setBodySample(e.target.value)} />
          </label>
          <label className="text-xs">{t("cms.theme.typography.h1Size")}
            <input className="ms-2 align-middle" type="range" min={20} max={64} value={sizeH1} onChange={(e) => setSizeH1(Number(e.target.value))} />
          </label>
          <label className="text-xs">{t("cms.theme.typography.h2Size")}
            <input className="ms-2 align-middle" type="range" min={16} max={40} value={sizeH2} onChange={(e) => setSizeH2(Number(e.target.value))} />
          </label>
          <label className="text-xs">{t("cms.theme.typography.bodySize")}
            <input className="ms-2 align-middle" type="range" min={12} max={24} value={sizeBody} onChange={(e) => setSizeBody(Number(e.target.value))} />
          </label>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t("cms.theme.typography.headingRange1")}</div>
          <div style={{ fontFamily: currentH1 as string, fontSize: `${sizeH1}px`, lineHeight: 1.2 }}>{headingSample}</div>
          <div className="mt-3 text-xs text-muted-foreground">{t("cms.theme.typography.headingRange2")}</div>
          <div style={{ fontFamily: currentH2 as string, fontSize: `${sizeH2}px`, lineHeight: 1.25 }}>{headingSample}</div>
          <div className="mt-3 text-xs text-muted-foreground">{t("cms.theme.typography.body")}</div>
          <div style={{ fontFamily: currentBody as string, fontSize: `${sizeBody}px`, lineHeight: 1.5 }}>{bodySample}</div>
        </div>
      </div>

      {/* Suggested pairings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("cms.theme.typography.suggestedPairings")}</h3>
          {!hideTagFilter && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-muted-foreground">{t("cms.theme.typography.tag")}</label>
              <select className="rounded border p-1" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="">{t("cms.theme.typography.all")}</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DSGrid cols={1} gap={3}>
          {filteredPairs.map((p) => {
            const body = p.tokens["--font-body"] || currentBody;
            const h1 = p.tokens["--font-heading-1"] || body;
            const h2 = p.tokens["--font-heading-2"] || body;
            [body, h1, h2].forEach((stack) => {
              const name = firstFamilyFromStack(stack);
              if (name && googleFamilies.has(name)) ensureGoogle(name);
            });
            const containerCls = `rounded border p-3 ${isPairingSelected(p) ? "border-primary ring-1 ring-primary/40" : ""}`; // i18n-exempt -- DX-0005: utility class string; not user copy [ttl=2026-01-01]
            return (
              <div key={p.id} className={containerCls}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">
                    {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
                    {p.name}
                  </div>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs min-h-11 min-w-11 inline-flex items-center justify-center"
                    onClick={() => applyPairing(p)}
                  >
                    {t("cms.theme.typography.usePairing")}
                  </button>
                </div>
                {isPairingSelected(p) && (
                  <div className="mb-2 inline-block rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-xs text-primary">{t("cms.theme.typography.selected")}</div>
                )}
                {p.tags && p.tags.length > 0 && (
                  <DSInline gap={1} className="mb-2 text-xs text-muted-foreground">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded border px-1">
                        {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
                        {t}
                      </span>
                    ))}
                  </DSInline>
                )}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("cms.theme.typography.heading1")}</div>
                  <div style={{ fontFamily: h1 as string, fontSize: `${sizeH1}px`, lineHeight: 1.2 }}>{headingSample}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{t("cms.theme.typography.heading2")}</div>
                  <div style={{ fontFamily: h2 as string, fontSize: `${sizeH2}px`, lineHeight: 1.25 }}>{headingSample}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{t("cms.theme.typography.body")}</div>
                  <div style={{ fontFamily: body as string, fontSize: `${sizeBody}px`, lineHeight: 1.5 }}>{bodySample}</div>
                </div>
              </div>
            );
          })}
        </DSGrid>
      </div>
      {/* Fine‑tune (optional) */}
      {showFineTune && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t("cms.theme.typography.fineTune")}</h3>
          <Tokens tokens={fontOnly(tokens)} baseTokens={fontOnly(baseTokens)} onChange={onChange} />
        </div>
      )}
    </section>
  );
}
