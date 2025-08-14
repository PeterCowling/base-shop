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
import { getContrast } from "@/components/cms";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { TokenMap } from "@ui/hooks/useTokenEditor";
import WizardPreview from "../../wizard/WizardPreview";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";
import { devicePresets } from "@ui/utils/devicePresets";

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

function checkContrast(colors: Record<string, string>): boolean {
  const pairs: Array<[string, string]> = [
    ["--color-bg", "--color-fg"],
    ["--color-primary", "--color-primary-fg"],
  ];
  return pairs.every(([bg, fg]) => {
    const bgVal = colors[bg];
    const fgVal = colors[fg];
    if (!bgVal || !fgVal) return true;
    return getContrast(bgVal, fgVal) >= 4.5;
  });
}

interface Props {
  themes: string[];
  prevStepId?: string;
  nextStepId?: string;
}

export default function StepTheme({
  themes,
  prevStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const themeStyle = useThemeLoader();
  const { state, update, themeDefaults, setThemeOverrides } = useConfigurator();
  const { theme, themeOverrides } = state;
  const [palette, setPalette] = useState(colorPalettes[0].name);
  const [, markComplete] = useStepCompletion("theme");
  const router = useRouter();
  const [deviceId, setDeviceId] = useState(devicePresets[0].id);
  const device = useMemo(() => {
    return devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
  }, [deviceId]);

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

  const handleTokenChange = useCallback(
    (tokens: TokenMap) => {
      setThemeOverrides(
        Object.fromEntries(
          Object.entries(tokens).filter(([k, v]) => themeDefaults[k] !== v)
        )
      );
    },
    [setThemeOverrides, themeDefaults]
  );

  const resetToDefaults = useCallback(() => {
    setThemeOverrides({});
    setPalette(colorPalettes[0].name);
  }, [setThemeOverrides]);

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
            try {
              const json = localStorage.getItem(STORAGE_KEY);
              if (json) {
                const data = JSON.parse(json);
                data.theme = v;
                data.themeOverrides = {};
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                window.dispatchEvent(new CustomEvent("configurator:update"));
              }
            } catch {
              /* ignore */
            }
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
                  src={`/themes/${t}.svg`}
                  alt={`${t} preview`}
                  className="h-6 w-6 rounded object-cover"
                />
                {t}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Palette picker – swatch buttons */}
      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {colorPalettes.map((p) => {
            const hasIssue = !checkContrast(p.colors);
            return (
              <div key={p.name} className="flex flex-col items-center gap-1">
                <Button
                  variant={p.name === palette ? "default" : "outline"}
                  onClick={() => setPalette(p.name)}
                  className="h-10 w-10 p-0"
                  aria-label={p.name}
                >
                  <div className="flex h-full w-full flex-wrap overflow-hidden rounded">
                    {Object.values(p.colors).map((c, i) => (
                      <span
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        className="h-1/2 w-1/2"
                        style={{ backgroundColor: `hsl(${c})` }}
                      />
                    ))}
                  </div>
                </Button>
                {hasIssue && (
                  <span
                    className="text-danger text-xs"
                    data-token="--color-danger"
                  >
                    Low contrast
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <StyleEditor
        tokens={themeOverrides}
        baseTokens={themeDefaults}
        onChange={handleTokenChange}
      />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to defaults
        </Button>
        <Select value={deviceId} onValueChange={setDeviceId}>
          <SelectTrigger aria-label="Device" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {devicePresets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <WizardPreview style={themeStyle} device={device} />

      <div className="flex justify-between">
        {prevStepId && (
          <Button
            variant="outline"
            onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
          >
            Back
          </Button>
        )}
        {nextStepId && (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/${nextStepId}`);
            }}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
