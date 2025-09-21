"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms/shadcn";
import StyleEditor from "@ui/components/cms/StyleEditor";
import Image from "next/image";
import DeviceSelector from "@ui/components/cms/DeviceSelector";
import WizardPreview from "../../wizard/WizardPreview";
import { getContrast } from "@ui/components/cms";
import type { TokenMap } from "@ui/hooks/useTokenEditor";
import type { DevicePreset } from "@ui/utils/devicePresets";

const MIN_CONTRAST = 4.5;

function checkContrast(fg?: string, bg?: string): number {
  if (!fg || !bg) return MIN_CONTRAST;
  return getContrast(fg, bg);
}

interface ThemeEditorFormProps {
  themes: string[];
  theme: string;
  onThemeChange: (v: string) => void;
  colorPalettes: Array<{ name: string; colors: Record<string, string> }>;
  palette: string;
  setPalette: (name: string) => void;
  themeOverrides: Record<string, string>;
  themeDefaults: Record<string, string>;
  onTokensChange: (tokens: TokenMap) => void;
  onReset: () => void;
  deviceId: string;
  orientation: "portrait" | "landscape";
  setDeviceId: (id: string) => void;
  toggleOrientation: () => void;
  device: DevicePreset;
  themeStyle: React.CSSProperties;
}

export default function ThemeEditorForm({
  themes,
  theme,
  onThemeChange,
  colorPalettes,
  palette,
  setPalette,
  themeOverrides,
  themeDefaults,
  onTokensChange,
  onReset,
  deviceId,
  orientation,
  setDeviceId,
  toggleOrientation,
  device,
  themeStyle,
}: ThemeEditorFormProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>

      <Select data-cy="theme-select" value={theme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t} value={t} textValue={t}>
              <div className="flex items-center gap-2">
                <Image
                  src={`/themes/${t}.svg`}
                  alt={`${t} preview`}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded object-cover"
                />
                {t}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {colorPalettes.map((p) => {
            const c1 = checkContrast(p.colors["--color-fg"], p.colors["--color-bg"]);
            const c2 = checkContrast(
              p.colors["--color-primary-fg"],
              p.colors["--color-primary"]
            );
            const warn = c1 < MIN_CONTRAST || c2 < MIN_CONTRAST;
            return (
              <div key={p.name} className="relative">
                <Button
                  variant={p.name === palette ? "default" : "outline"}
                  onClick={() => setPalette(p.name)}
                  className="h-10 w-10 p-0"
                  aria-label={p.name}
                  data-cy={`palette-${p.name}`}
                >
                  <div className="flex h-full w-full flex-wrap overflow-hidden rounded">
                    {Object.values(p.colors).map((c, i) => (
                      <span
                        key={i}
                        className="h-1/2 w-1/2"
                        style={{ backgroundColor: `hsl(${c})` }}
                      />
                    ))}
                  </div>
                </Button>
                {warn && (
                  <span className="absolute -top-1 -right-1 rounded bg-warning/20 px-1 text-xs text-warning-foreground">
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
        onChange={onTokensChange}
      />
      <div className="flex justify-between">
        <Button data-cy="reset-theme" variant="outline" onClick={onReset}>
          Reset to defaults
        </Button>
        <DeviceSelector
          deviceId={deviceId}
          orientation={orientation}
          setDeviceId={setDeviceId}
          toggleOrientation={toggleOrientation}
        />
      </div>

      <WizardPreview style={themeStyle} device={device} />
    </div>
  );
}
