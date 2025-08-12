"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import { useEffect, useState } from "react";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

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
  themeDefaults: Record<string, string>;
  themeOverrides: Record<string, string>;
  setThemeOverrides: (v: Record<string, string>) => void;
  setThemeVars: (v: Record<string, string>) => void;
  themeStyle: React.CSSProperties;
}

export default function StepTheme({
  themes,
  theme,
  setTheme,
  themeDefaults,
  themeOverrides,
  setThemeOverrides,
  setThemeVars,
  themeStyle,
}: Props): React.JSX.Element {
  const [palette, setPalette] = useState(colorPalettes[0].name);
  const [, markComplete] = useStepCompletion("theme");
  const router = useRouter();

  const themeVars = { ...themeDefaults, ...themeOverrides };

  useEffect(() => {
    setThemeVars({ ...themeDefaults, ...themeOverrides });
  }, [themeDefaults, themeOverrides, setThemeVars]);

  const handleThemeChange = (next: string) => {
    setTheme(next);
    setPalette(colorPalettes[0].name);
    setThemeOverrides({});
  };

  const applyPalette = (name: string) => {
    setPalette(name);
    const cp = colorPalettes.find((c) => c.name === name);
    if (!cp) return;
    const next = { ...themeOverrides } as Record<string, string>;
    Object.entries(cp.colors).forEach(([k, v]) => {
      if (themeDefaults[k] === v) {
        delete next[k];
      } else {
        next[k] = v;
      }
    });
    setThemeOverrides(next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>

      {/* single accessible combobox (theme) */}
      <Select value={theme} onValueChange={handleThemeChange}>
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

      {/* Palette picker – buttons, no additional combobox */}
      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {colorPalettes.map((p) => (
            <Button
              key={p.name}
              variant={p.name === palette ? "default" : "outline"}
              onClick={() => applyPalette(p.name)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Style editor shows default values and overrides */}
      <div aria-hidden="true">
        <StyleEditor
          tokens={themeVars}
          baseTokens={themeDefaults}
          onChange={() => {}}
        />
      </div>

      <WizardPreview style={themeStyle} />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}
