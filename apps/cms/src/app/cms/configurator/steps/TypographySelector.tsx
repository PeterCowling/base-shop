"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TokenMap } from "../../wizard/tokenUtils";
import Tokens from "@ui/components/cms/style/Tokens";
import presetData from "@ui/components/cms/style/presets.json";

interface Props {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (next: TokenMap) => void;
  /** Optional shared tag filter injected by parent */
  tagFilter?: string;
  /** Hide the built-in tag filter UI when a shared filter is provided */
  hideTagFilter?: boolean;
}

type PairPreset = { id: string; name: string; tags?: string[]; tokens: Record<string, string> };

export default function TypographySelector({ tokens, baseTokens, onChange, tagFilter: externalTagFilter, hideTagFilter }: Props) {
  const pairings = useMemo(() => (presetData as unknown as PairPreset[]).filter((p) => p.id.startsWith("type-")), []);

  const googleFamilies = useMemo(
    () =>
      new Set([
        "Inter",
        "Space Grotesk",
        "Playfair Display",
        "Lato",
        "Source Sans 3",
        "Montserrat",
        "Rubik",
        "Work Sans",
        "Nunito",
        "Quicksand",
        "Open Sans",
        "Roboto",
        "Merriweather",
        "Poppins",
      ]),
    [],
  );

  const ensureGoogle = useCallback((name: string | null | undefined) => {
    if (!name) return;
    const id = `google-font-${name}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const firstFamilyFromStack = useCallback((stack: string | undefined): string | null => {
    if (!stack) return null;
    const m = stack.match(/"([^"]+)"/);
    if (m) return m[1];
    const first = stack.split(",")[0]?.trim();
    if (!first || first.startsWith("var(")) return null;
    return first.replace(/^["']|["']$/g, "");
  }, []);

  const currentBody = tokens["--font-body"] ?? baseTokens["--font-body"] ?? tokens["--font-sans"] ?? baseTokens["--font-sans"] ?? "var(--font-sans)";
  const currentH1 = tokens["--font-heading-1"] ?? baseTokens["--font-heading-1"] ?? currentBody;
  const currentH2 = tokens["--font-heading-2"] ?? baseTokens["--font-heading-2"] ?? currentBody;

  useEffect(() => {
    [currentBody, currentH1, currentH2].forEach((stack) => {
      const name = firstFamilyFromStack(stack);
      if (name && googleFamilies.has(name)) ensureGoogle(name);
    });
  }, [currentBody, currentH1, currentH2, firstFamilyFromStack, ensureGoogle, googleFamilies]);

  const [headingSample, setHeadingSample] = useState("Grumpy wizards make toxic brew");
  const [bodySample, setBodySample] = useState("The quick brown fox jumps over the lazy dog");
  const [sizeH1, setSizeH1] = useState(36);
  const [sizeH2, setSizeH2] = useState(24);
  const [sizeBody, setSizeBody] = useState(16);

  const [tagFilter, setTagFilter] = useState<string>(externalTagFilter ?? "");
  const allTags = useMemo(() => {
    const t = new Set<string>();
    pairings.forEach((p) => (p.tags || []).forEach((tag) => t.add(tag)));
    return Array.from(t).sort();
  }, [pairings]);
  const filteredPairs = useMemo(() => {
    const active = externalTagFilter ?? tagFilter;
    if (!active) return pairings;
    return pairings.filter((p) => (p.tags || []).some((t) => t === active));
  }, [pairings, tagFilter, externalTagFilter]);

  // Keep internal state in sync when parent drives the filter
  useEffect(() => {
    if (externalTagFilter !== undefined) setTagFilter(externalTagFilter);
  }, [externalTagFilter]);

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

  const fontOnly = useCallback((map: TokenMap) => {
    const out: Record<string, string> = {};
    Object.entries(map as Record<string, string>).forEach(([k, v]) => {
      if (k.startsWith("--font") || k.includes("font-family")) out[k] = v;
    });
    return out as TokenMap;
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Typography</h2>
      {/* Current selection preview */}
      <div className="rounded border p-4">
        <div className="mb-3 flex flex-wrap items-end gap-4">
          <label className="text-xs">Heading sample
            <input className="ml-2 h-8 w-60 rounded border px-2 text-sm" value={headingSample} onChange={(e) => setHeadingSample(e.target.value)} />
          </label>
          <label className="text-xs">Body sample
            <input className="ml-2 h-8 w-60 rounded border px-2 text-sm" value={bodySample} onChange={(e) => setBodySample(e.target.value)} />
          </label>
          <label className="text-xs">H1 size
            <input className="ml-2 align-middle" type="range" min={20} max={64} value={sizeH1} onChange={(e) => setSizeH1(Number(e.target.value))} />
          </label>
          <label className="text-xs">H2 size
            <input className="ml-2 align-middle" type="range" min={16} max={40} value={sizeH2} onChange={(e) => setSizeH2(Number(e.target.value))} />
          </label>
          <label className="text-xs">Body size
            <input className="ml-2 align-middle" type="range" min={12} max={24} value={sizeBody} onChange={(e) => setSizeBody(Number(e.target.value))} />
          </label>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Heading 1 (H1–H3)</div>
          <div style={{ fontFamily: currentH1 as string, fontSize: `${sizeH1}px`, lineHeight: 1.2 as any }}>{headingSample}</div>
          <div className="mt-3 text-xs text-muted-foreground">Heading 2 (H4–H6)</div>
          <div style={{ fontFamily: currentH2 as string, fontSize: `${sizeH2}px`, lineHeight: 1.25 as any }}>{headingSample}</div>
          <div className="mt-3 text-xs text-muted-foreground">Body</div>
          <div style={{ fontFamily: currentBody as string, fontSize: `${sizeBody}px`, lineHeight: 1.5 as any }}>{bodySample}</div>
        </div>
      </div>

      {/* Suggested pairings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Suggested Pairings</h3>
          {!hideTagFilter && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-muted-foreground">Tag</label>
              <select className="rounded border p-1" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="">All</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {filteredPairs.map((p) => {
            const body = p.tokens["--font-body"] || currentBody;
            const h1 = p.tokens["--font-heading-1"] || body;
            const h2 = p.tokens["--font-heading-2"] || body;
            [body, h1, h2].forEach((stack) => {
              const name = firstFamilyFromStack(stack);
              if (name && googleFamilies.has(name)) ensureGoogle(name);
            });
            return (
              <div key={p.id} className="rounded border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => applyPairing(p)}>
                    Use pairing
                  </button>
                </div>
                {p.tags && p.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded border px-1">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Heading 1</div>
                  <div style={{ fontFamily: h1 as string, fontSize: `${sizeH1}px`, lineHeight: 1.2 as any }}>{headingSample}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Heading 2</div>
                  <div style={{ fontFamily: h2 as string, fontSize: `${sizeH2}px`, lineHeight: 1.25 as any }}>{headingSample}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Body</div>
                  <div style={{ fontFamily: body as string, fontSize: `${sizeBody}px`, lineHeight: 1.5 as any }}>{bodySample}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Fine‑tune (optional) */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Fine‑tune</h3>
        <Tokens tokens={fontOnly(tokens)} baseTokens={fontOnly(baseTokens)} onChange={onChange} />
      </div>
    </section>
  );
}
