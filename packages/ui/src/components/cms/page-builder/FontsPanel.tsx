"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../atoms/shadcn";
import { type TokenMap } from "../../../hooks/useTokenEditor";
import usePreviewTokens, { savePreviewTokens } from "./hooks/usePreviewTokens";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import presetData from "../style/presets.json";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Render mode: dialog (default) or sidebar inline panel */
  variant?: "dialog" | "sidebar";
}

export default function FontsPanel({ open, onOpenChange, variant = "dialog" }: Props) {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname) ?? "", [pathname]);
  const preview = usePreviewTokens();

  // Working copies
  const [tokens, setTokens] = useState<TokenMap>(preview as TokenMap);
  const [baseTokens, setBaseTokens] = useState<TokenMap>({} as TokenMap);
  const tokensRef = useRef<TokenMap>(tokens);
  const baseTokensRef = useRef<TokenMap>(baseTokens);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);
  useEffect(() => {
    baseTokensRef.current = baseTokens;
  }, [baseTokens]);

  // Debounced saving (same as ThemePanel)
  const pendingRef = useRef<Record<string, string | null>>({});
  const timeoutRef = useRef<number | null>(null);
  const scheduleSave = useCallback((patch: Record<string, string | null>) => {
    if (Object.keys(patch).length === 0) return;
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      const body = { themeOverrides: pendingRef.current } as Record<string, unknown>;
      pendingRef.current = {};
      try {
        if (shop) {
          await fetch(`/cms/api/shops/${shop}/theme`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      } catch {
        // ignore network errors in-editor
      }
    }, 500);
  }, [shop]);

  const diffTokens = useCallback((prev: TokenMap, next: TokenMap) => {
    const patch: Record<string, string | null> = {};
    Object.entries(next).forEach(([key, value]) => {
      if (prev[key as keyof TokenMap] !== value) patch[key] = value;
    });
    Object.keys(prev).forEach((key) => {
      if (!(key in next)) patch[key] = null;
    });
    return patch;
  }, []);

  const applyTokens = useCallback((next: TokenMap) => {
    const previous = tokensRef.current;
    const patch = diffTokens(previous, next);
    tokensRef.current = next;
    setTokens(next);
    savePreviewTokens(next as Record<string, string>);
    if (Object.keys(patch).length > 0) scheduleSave(patch);
  }, [diffTokens, scheduleSave]);

  // No fine-tune editor in this panel; changes come from pairings/applyTokens

  // Load current theme on open
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!shop) return;
      try {
        const res = await fetch(`/cms/api/shops/${shop}/theme`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          themeDefaults: Record<string, string>;
          themeTokens: Record<string, string>;
        };
        if (cancelled) return;
        const defaults = data.themeDefaults as TokenMap;
        const themeTokens = data.themeTokens as TokenMap;
        baseTokensRef.current = defaults;
        tokensRef.current = themeTokens;
        setBaseTokens(defaults);
        setTokens(themeTokens);
        savePreviewTokens(themeTokens);
      } catch {
        // ignore
      }
    };
    if (open) void init();
    return () => {
      cancelled = true;
    };
  }, [shop, open]);

  // (Fine-tune editor removed)

  // Google Fonts-like selector helpers and state
  const googleFamilies = useMemo(() => new Set([
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
  ]), []);

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

  type PairPreset = { id: string; name: string; tags?: string[]; tokens: Record<string, string> };
  const pairings = useMemo(() => (presetData as unknown as PairPreset[]).filter((p) => p.id.startsWith("type-")), []);
  const [tagFilter, setTagFilter] = useState<string>("");
  const allTags = useMemo(() => {
    const t = new Set<string>();
    pairings.forEach((p) => (p.tags || []).forEach((tag) => t.add(tag)));
    return Array.from(t).sort();
  }, [pairings]);
  const filteredPairs = useMemo(() => {
    if (!tagFilter) return pairings;
    return pairings.filter((p) => (p.tags || []).some((t) => t === tagFilter));
  }, [pairings, tagFilter]);

  const applyPairing = useCallback((p: PairPreset) => {
    const next = { ...tokensRef.current } as Record<string, string>;
    ["--font-body", "--font-heading-1", "--font-heading-2"].forEach((k) => {
      if (p.tokens[k]) next[k] = p.tokens[k];
    });
    Object.values(p.tokens).forEach((v) => {
      const name = firstFamilyFromStack(v);
      if (name && googleFamilies.has(name)) ensureGoogle(name);
    });
    applyTokens(next as TokenMap);
  }, [applyTokens, ensureGoogle, firstFamilyFromStack, googleFamilies]);

  const content = (
    <div className="space-y-6 p-3">
      <div className="text-sm font-semibold">Typography</div>
      <p className="text-sm text-muted-foreground">
        Choose three fonts: Body, Heading 1 (H1–H3), Heading 2 (H4–H6). Previews render in the actual fonts.
      </p>

          {/* Current selection preview */}
          <div className="rounded border bg-surface-2 p-4">
            <div className="mb-3 flex flex-wrap items-end gap-4">
              <label className="text-xs">Heading sample
                <input className="ms-2 h-8 w-60 rounded border px-2 text-sm" value={headingSample} onChange={(e) => setHeadingSample(e.target.value)} />
              </label>
              <label className="text-xs">Body sample
                <input className="ms-2 h-8 w-60 rounded border px-2 text-sm" value={bodySample} onChange={(e) => setBodySample(e.target.value)} />
              </label>
              <label className="text-xs">H1 size
                <input className="ms-2 align-middle" type="range" min={20} max={64} value={sizeH1} onChange={(e) => setSizeH1(Number(e.target.value))} />
              </label>
              <label className="text-xs">H2 size
                <input className="ms-2 align-middle" type="range" min={16} max={40} value={sizeH2} onChange={(e) => setSizeH2(Number(e.target.value))} />
              </label>
              <label className="text-xs">Body size
                <input className="ms-2 align-middle" type="range" min={12} max={24} value={sizeBody} onChange={(e) => setSizeBody(Number(e.target.value))} />
              </label>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-foreground">Heading 1 (H1–H3) <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(currentH1) || ""}</span></div>
              <div className="text-foreground" style={{ fontFamily: currentH1, fontSize: `${sizeH1}px`, lineHeight: 1.2 }}>{headingSample}</div>
              <div className="mt-3 text-xs text-foreground">Heading 2 (H4–H6) <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(currentH2) || ""}</span></div>
              <div className="text-foreground" style={{ fontFamily: currentH2, fontSize: `${sizeH2}px`, lineHeight: 1.25 }}>{headingSample}</div>
              <div className="mt-3 text-xs text-foreground">Body <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(currentBody) || ""}</span></div>
              <div className="text-foreground" style={{ fontFamily: currentBody, fontSize: `${sizeBody}px`, lineHeight: 1.5 }}>{bodySample}</div>
            </div>
          </div>

          {/* Suggested pairings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Suggested Pairings</h3>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-foreground">Tag</label>
                <select
                  className="rounded border border-border-2 bg-input p-1 text-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
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
                  <div key={p.id} className="rounded border bg-surface-2 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <button
                        type="button"
                        className="rounded border border-border-2 bg-surface-3 px-2 py-1 text-xs text-foreground transition-colors hover:bg-surface-2 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary"
                        onClick={() => applyPairing(p)}
                      >
                        Use pairing
                      </button>
                    </div>
                    {p.tags && p.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1 text-xs text-foreground/80">
                        {p.tags.map((t) => <span key={t} className="rounded border border-border-2 bg-surface-3 px-1">{t}</span>)}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-xs text-foreground">Heading 1 <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(h1) || ""}</span></div>
                      <div className="text-foreground" style={{ fontFamily: h1, fontSize: `${sizeH1}px`, lineHeight: 1.2 }}>{headingSample}</div>
                      <div className="mt-2 text-xs text-foreground">Heading 2 <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(h2) || ""}</span></div>
                      <div className="text-foreground" style={{ fontFamily: h2, fontSize: `${sizeH2}px`, lineHeight: 1.25 }}>{headingSample}</div>
                      <div className="mt-2 text-xs text-foreground">Body <span className="ms-2 align-middle text-xs text-foreground/70">{firstFamilyFromStack(body) || ""}</span></div>
                      <div className="text-foreground" style={{ fontFamily: body, fontSize: `${sizeBody}px`, lineHeight: 1.5 }}>{bodySample}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fine-tune removed per request */}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <aside className="h-screen overflow-auto bg-surface-3" role="region" aria-label="Typography Panel">
        {content}
      </aside>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed start-1/2 top-1/2 z-[70] max-h-[90vh] w-[min(100vw-2rem,80rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto border bg-surface-3 p-0 shadow-elevation-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle>Typography</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
