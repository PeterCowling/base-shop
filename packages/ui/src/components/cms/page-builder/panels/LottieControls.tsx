// packages/ui/src/components/cms/page-builder/panels/LottieControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from "../../../atoms/shadcn";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function LottieControls({ component, handleInput }: Props) {
  type LottieFields = {
    lottieUrl?: string;
    lottieAutoplay?: boolean;
    lottieLoop?: boolean;
    lottieSpeed?: number;
    lottieTrigger?: "load" | "hover" | "click" | "in-view" | "scroll";
  };
  const l = component as unknown as Partial<LottieFields>;
  const lottieUrl = l.lottieUrl;
  const lottieAutoplay = l.lottieAutoplay;
  const lottieLoop = l.lottieLoop;
  const lottieSpeed = l.lottieSpeed;
  const lottieTrigger = l.lottieTrigger;

  return (
    <div className="space-y-2">
      <Input
        // i18n-exempt: Builder control label
        label="Lottie JSON URL"
        // i18n-exempt: Example URL for editors
        placeholder="https://example.com/anim.json"
        value={lottieUrl ?? ""}
        onChange={(e) =>
          (handleInput as unknown as (f: string, v: unknown) => void)(
            "lottieUrl",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <div className="grid grid-cols-3 gap-2 items-end">
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          {/* i18n-exempt: Builder toggle label */}
          <span>Autoplay</span>
          <Checkbox
            checked={!!lottieAutoplay}
            onCheckedChange={(v) =>
              (handleInput as unknown as (f: string, v: unknown) => void)(
                "lottieAutoplay",
                Boolean(v) as unknown,
              )
            }
          />
        </label>
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          {/* i18n-exempt: Builder toggle label */}
          <span>Loop</span>
          <Checkbox
            checked={!!lottieLoop}
            onCheckedChange={(v) =>
              (handleInput as unknown as (f: string, v: unknown) => void)(
                "lottieLoop",
                Boolean(v) as unknown,
              )
            }
          />
        </label>
        <Input
          type="number"
          step="0.1"
          min="0.1"
          // i18n-exempt: Builder control label
          label="Speed"
          // i18n-exempt: Example value for editors
          placeholder="1"
          value={lottieSpeed ?? ""}
          onChange={(e) =>
            (handleInput as unknown as (f: string, v: unknown) => void)(
              "lottieSpeed",
              (e.target.value === "" ? undefined : Number(e.target.value)) as unknown,
            )
          }
        />
      </div>
      <Select
        value={lottieTrigger ?? "load"}
        onValueChange={(v) =>
          (handleInput as unknown as (f: string, v: unknown) => void)(
            "lottieTrigger",
            v as unknown,
          )
        }
      >
        <SelectTrigger aria-label="Lottie Trigger">
          {/* i18n-exempt: Builder control label */}
          <SelectValue placeholder="Trigger" />
        </SelectTrigger>
        <SelectContent>
          {/* i18n-exempt: Builder options */}
          <SelectItem value="load">{/* i18n-exempt */}On Load</SelectItem>
          <SelectItem value="in-view">{/* i18n-exempt */}On In-View</SelectItem>
          <SelectItem value="hover">{/* i18n-exempt */}On Hover</SelectItem>
          <SelectItem value="click">{/* i18n-exempt */}On Click</SelectItem>
          <SelectItem value="scroll">{/* i18n-exempt */}Scroll Progress</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
