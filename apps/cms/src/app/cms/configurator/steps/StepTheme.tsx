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
import { useCallback, useEffect, useState } from "react";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";

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
}

function themeThumb(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="4" ry="4" fill="#e5e5e5"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#666" font-family="sans-serif">${label.slice(0,1).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function StepTheme({ themes }: Props): React.JSX.Element {
  const themeStyle = useThemeLoader();
  const { state, update, themeDefaults, setThemeOverrides } =
    useConfigurator();
  const { theme, themeOverrides } = state;
  const [palette, setPalette] = useState(colorPalettes[0].name);
  const [, markComplete] = useStepCompletion("theme");
  const router = useRouter();

  const applyPalette = useCallback(
    (name: string) => {
      const cp = colorPalettes.find((c) => c.name === name);
      if (!cp) return;
      setThemeOverrides((prev) => {
        const next = { ...prev };
        Object.entries(cp.colors).forEach(([k, v]) => {
          if (themeDefaults[k] !== v) {
            next[k] = v;
          } else {
            delete next[k];
          }
        });
        return next;
      });
    },
    [themeDefaults, setThemeOverrides]
  );

  useEffect(() => {
    applyPalette(palette);
  }, [palette, applyPalette]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>

      {/* single accessible combobox (theme) */}
      <Select
        value={theme}
        onValueChange={(v) => {
          update("theme", v);
          setThemeOverrides({});
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("configurator:update"));
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t} value={t}>
              <div className="flex items-center gap-2">
                <img
                  src={themeThumb(t)}
                  alt={`${t} theme preview`}
                  className="h-8 w-8 rounded object-cover"
                />
                <span>{t}</span>
              </div>
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
              onClick={() => setPalette(p.name)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Style editor is purely presentational at this step */}
      <div aria-hidden="true">
        <StyleEditor
          tokens={themeOverrides}
          baseTokens={themeDefaults}
          onChange={setThemeOverrides}
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
