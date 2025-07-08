"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import { useState } from "react";
import WizardPreview from "../WizardPreview";

const colorPalettes: Array<{
  name: string;
  colors: Record<string, string>;
}> = [
  {
    name: "Base",
    colors: {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--color-primary": "220 90% 56%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "260 83% 67%",
      "--color-muted": "0 0% 88%",
    },
  },
  {
    name: "Dark",
    colors: {
      "--color-bg": "0 0% 4%",
      "--color-fg": "0 0% 93%",
      "--color-primary": "220 90% 66%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "260 83% 67%",
      "--color-muted": "0 0% 60%",
    },
  },
  {
    name: "Forest",
    colors: {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--color-primary": "160 80% 40%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "200 90% 45%",
      "--color-muted": "0 0% 88%",
    },
  },
];

interface Props {
  themes: string[];
  theme: string;
  setTheme: (v: string) => void;
  themeVars: Record<string, string>;
  setThemeVars: (v: Record<string, string>) => void;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepTheme({
  themes,
  theme,
  setTheme,
  themeVars,
  setThemeVars,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const [palette, setPalette] = useState(colorPalettes[0].name);

  const applyPalette = (name: string) => {
    setPalette(name);
    const p = colorPalettes.find((c) => c.name === name);
    if (!p) return;
    const newVars = { ...themeVars };
    Object.entries(p.colors).forEach(([k, v]) => {
      newVars[k] = v;
    });
    setThemeVars(newVars);
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <Select value={palette} onValueChange={applyPalette}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select palette" />
          </SelectTrigger>
          <SelectContent>
            {colorPalettes.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <StyleEditor tokens={themeVars} onChange={setThemeVars} />
      <WizardPreview style={themeStyle} />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
