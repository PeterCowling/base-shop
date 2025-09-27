"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
// i18n-exempt — identifiers only; provide identity translator for linting
/* i18n-exempt */
const t = (s: string) => s;

export type TokenMap = Record<`--${string}`, string>;

export interface TokenInfo {
  key: string;
  value: string;
  defaultValue?: string;
  isOverridden: boolean;
}

/* i18n-exempt: token editor font lists are CSS values, not user copy */
const defaultSansFonts = [
  '"Geist Sans", var(--font-sans)',
  'Arial, var(--font-sans)',
  'ui-sans-serif, var(--font-sans)',
];

/* i18n-exempt: token editor font lists are CSS values, not user copy */
const defaultMonoFonts = [
  '"Geist Mono", var(--font-mono)',
  '"Courier New", var(--font-mono)',
];

/* i18n-exempt: font family names are identifiers, not user copy */
const googleFontList = [
  t("Inter"),
  t("Roboto"),
  t("Open Sans"),
  t("Lato"),
  t("Merriweather"),
  t("Poppins"),
  // Additional popular families for pairings
  t("Space Grotesk"),
  t("Playfair Display"),
  t("Source Sans 3"),
  t("Montserrat"),
  t("Rubik"),
  t("Work Sans"),
  t("Nunito"),
  t("Quicksand"),
];

export interface UseTokenEditorResult {
  colors: TokenInfo[];
  fonts: TokenInfo[];
  others: TokenInfo[];
  sansFonts: string[];
  monoFonts: string[];
  newFont: string;
  googleFonts: string[];
  setNewFont: (v: string) => void;
  setToken: (key: string, value: string) => void;
  handleUpload: (
    type: "sans" | "mono",
    e: ChangeEvent<HTMLInputElement>
  ) => void;
  addCustomFont: () => void;
  setGoogleFont: (type: "sans" | "mono", name: string) => void;
}

export function useTokenEditor(
  tokens: TokenMap,
  baseTokens: TokenMap,
  onChange: (tokens: TokenMap) => void
): UseTokenEditorResult {
  const setToken = useCallback(
    (key: string, value: string) => {
      onChange({ ...tokens, [key]: value });
    },
    [tokens, onChange]
  );

  const [sansFonts, setSansFonts] = useState<string[]>([...defaultSansFonts]);
  const [monoFonts, setMonoFonts] = useState<string[]>([...defaultMonoFonts]);
  const [googleFonts] = useState<string[]>(googleFontList);
  const [newFont, setNewFont] = useState("");
  const newFontRef = useRef(newFont);

  useEffect(() => {
    newFontRef.current = newFont;
  }, [newFont]);

  useEffect(() => {
    Object.entries(tokens).forEach(([k, v]) => {
      if (k.startsWith("--font-src-")) {
        const name = k.slice("--font-src-".length);
        if (!document.getElementById(`font-${name}`)) {
          const style = document.createElement("style");
          style.id = `font-${name}`;
          style.textContent = `@font-face { font-family: '${name}'; src: url(${v}); }`;
          document.head.appendChild(style);
        }
        const stack = `"${name}"`;
        setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
        setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
      }
    });
  }, [tokens]);

  const handleUpload = useCallback(
    (type: "sans" | "mono", e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const name = file.name.replace(/\.[^.]+$/, "");
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setToken(`--font-src-${name}`, dataUrl);
        const stack = `"${name}"`;
        if (type === "mono") {
          setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
          setToken("--font-mono", stack);
        } else {
          setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
          setToken("--font-sans", stack);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [setToken]
  );

  const addCustomFont = useCallback(() => {
    const value = newFontRef.current;
    if (!value.trim()) return;
    setSansFonts((f) => (f.includes(value) ? f : [...f, value]));
    setMonoFonts((f) => (f.includes(value) ? f : [...f, value]));
    setNewFont("");
  }, [setSansFonts, setMonoFonts, setNewFont]);

  const loadGoogleFont = useCallback((name: string) => {
    const id = `google-font-${name}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const setGoogleFont = useCallback(
    (type: "sans" | "mono", name: string) => {
      loadGoogleFont(name);
      const fallback = type === "mono" ? "mono" : "sans";
      const stack = `"${name}", var(--font-${fallback})`;
      if (type === "mono") {
        setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
        setToken("--font-mono", stack);
      } else {
        setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
        setToken("--font-sans", stack);
      }
    },
    [loadGoogleFont, setToken]
  );

  const { colors, fonts, others } = useMemo(() => {
    const c: TokenInfo[] = [];
    const f: TokenInfo[] = [];
    const o: TokenInfo[] = [];
    const keys = new Set([
      ...Object.keys(baseTokens),
      ...Object.keys(tokens),
    ]);
    keys.forEach((k) => {
      const current = tokens[k as keyof TokenMap] ?? baseTokens[k as keyof TokenMap];
      const def = baseTokens[k as keyof TokenMap];
      const info: TokenInfo = {
        key: k,
        value: current,
        defaultValue: def,
        isOverridden: def !== undefined && current !== def,
      };
      if (k.startsWith("--color")) {
        c.push(info);
      } else if (k.startsWith("--font")) {
        f.push(info);
      } else {
        o.push(info);
      }
    });
    // Keep all font tokens visible to ensure Font group renders consistently
    const sortedFonts = f.sort((a, b) => {
      const order = [
        "--font-sans",
        "--font-mono",
        "--font-body",
        "--font-heading-1",
        "--font-heading-2",
      ];
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.key.localeCompare(b.key);
    });
    return { colors: c, fonts: sortedFonts, others: o };
  }, [tokens, baseTokens]);

  return {
    colors,
    fonts,
    others,
    sansFonts,
    monoFonts,
    googleFonts,
    newFont,
    setNewFont,
    setToken,
    handleUpload,
    addCustomFont,
    setGoogleFont,
  };
}
