import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

export type TokenMap = Record<`--${string}`, string>;

const defaultSansFonts = [
  '"Geist Sans", system-ui, sans-serif',
  "Arial, sans-serif",
  "ui-sans-serif, system-ui",
];

const defaultMonoFonts = [
  '"Geist Mono", ui-monospace, monospace',
  '"Courier New", monospace',
];

export interface UseTokenEditorResult {
  colors: Array<[string, string]>;
  fonts: Array<[string, string]>;
  others: Array<[string, string]>;
  sansFonts: string[];
  monoFonts: string[];
  newFont: string;
  setNewFont: (v: string) => void;
  setToken: (key: string, value: string) => void;
  handleUpload: (
    type: "sans" | "mono",
    e: ChangeEvent<HTMLInputElement>
  ) => void;
  addCustomFont: () => void;
}

export function useTokenEditor(
  tokens: TokenMap,
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
  const [newFont, setNewFont] = useState("");

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
    if (!newFont.trim()) return;
    setSansFonts((f) => (f.includes(newFont) ? f : [...f, newFont]));
    setMonoFonts((f) => (f.includes(newFont) ? f : [...f, newFont]));
    setNewFont("");
  }, [newFont]);

  const { colors, fonts, others } = useMemo(() => {
    const c: Array<[string, string]> = [];
    const f: Array<[string, string]> = [];
    const o: Array<[string, string]> = [];
    Object.entries(tokens).forEach(([k, v]) => {
      if (k.startsWith("--color")) {
        c.push([k, v]);
      } else if (k.startsWith("--font")) {
        f.push([k, v]);
      } else {
        o.push([k, v]);
      }
    });
    return { colors: c, fonts: f, others: o };
  }, [tokens]);

  return {
    colors,
    fonts,
    others,
    sansFonts,
    monoFonts,
    newFont,
    setNewFont,
    setToken,
    handleUpload,
    addCustomFont,
  };
}
