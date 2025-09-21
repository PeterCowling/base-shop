"use client";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../atoms/shadcn";
import {
  devicePresets,
  getLegacyPreset,
  type DevicePreset,
  getAllDevicePresets,
  getCustomDevicePresets,
  saveCustomDevicePresets,
} from "../../utils/devicePresets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Select as UISelect, SelectContent as UISelectContent, SelectItem as UISelectItem, SelectTrigger as UISelectTrigger, SelectValue as UISelectValue } from "../atoms/shadcn";
import { useEffect, useMemo, useState } from "react";

interface Props {
  deviceId: string;
  onChange: (id: string) => void;
  showLegacyButtons?: boolean;
  /** Additional devices to include in the dropdown (e.g., page breakpoints). */
  extraDevices?: DevicePreset[];
  /** Hide the quick device icon buttons on small screens to save space. */
  compact?: boolean;
}

export default function DeviceSelector({
  deviceId,
  onChange,
  showLegacyButtons = false,
  extraDevices = [],
  compact = false,
}: Props): React.JSX.Element {
  const [custom, setCustom] = useState<DevicePreset[]>([]);
  useEffect(() => {
    setCustom(getCustomDevicePresets());
  }, []);
  const allPresets = useMemo<DevicePreset[]>(() => {
    const base = getAllDevicePresets();
    const map = new Map<string, DevicePreset>();
    [...base, ...extraDevices].forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [custom, extraDevices]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ label: string; width: string; height: string; type: "desktop" | "tablet" | "mobile" }>({ label: "", width: "", height: "", type: "desktop" });

  const addPreset = () => {
    const width = parseInt(draft.width, 10);
    const height = parseInt(draft.height, 10);
    if (!draft.label || !Number.isFinite(width) || !Number.isFinite(height)) return;
    const idBase = draft.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let id = `custom-${idBase}`;
    let i = 1;
    const exists = new Set(allPresets.map((p) => p.id));
    while (exists.has(id)) { id = `custom-${idBase}-${i++}`; }
    const next: DevicePreset = { id, label: draft.label, width, height, type: draft.type, orientation: "portrait" };
    const updated = [...getCustomDevicePresets(), next];
    saveCustomDevicePresets(updated);
    setCustom(updated);
    setDraft({ label: "", width: "", height: "", type: draft.type });
    onChange(id);
  };
  const removePreset = (id: string) => {
    const updated = getCustomDevicePresets().filter((p) => p.id !== id);
    saveCustomDevicePresets(updated);
    setCustom(updated);
    if (deviceId === id) onChange(devicePresets[0]?.id || "");
  };

  return (
    <div className="flex items-center gap-2">
      {showLegacyButtons &&
        (["desktop", "tablet", "mobile"] as const).map((t) => {
          const preset = getLegacyPreset(t);
          const Icon =
            t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
          return (
            <Button
              key={t}
              variant={deviceId === preset.id ? "default" : "outline"}
              size="icon"
              className={compact ? "hidden sm:inline-flex" : undefined}
              onClick={() => onChange(preset.id)}
              aria-label={t}
            >
              <Icon />
              <span className="sr-only">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </Button>
          );
        })}
      <Select value={deviceId} onValueChange={onChange}>
        <SelectTrigger aria-label="Device" className="w-28 sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allPresets.map((p: DevicePreset) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">Manage</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Devices</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">Custom presets</div>
            <ul className="max-h-40 space-y-1 overflow-auto">
              {custom.length === 0 && (
                <li className="text-sm text-muted-foreground">No custom devices</li>
              )}
              {custom.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>{p.label} — {p.width}×{p.height} ({p.type})</div>
                  <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => removePreset(p.id)}>Delete</Button>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <Input placeholder="Label" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
              <Input placeholder="Width" type="number" value={draft.width} onChange={(e) => setDraft((d) => ({ ...d, width: e.target.value }))} />
              <Input placeholder="Height" type="number" value={draft.height} onChange={(e) => setDraft((d) => ({ ...d, height: e.target.value }))} />
              <UISelect value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v as "desktop" | "tablet" | "mobile" }))}>
                <UISelectTrigger>
                  <UISelectValue placeholder="Type" />
                </UISelectTrigger>
                <UISelectContent>
                  <UISelectItem value="desktop">desktop</UISelectItem>
                  <UISelectItem value="tablet">tablet</UISelectItem>
                  <UISelectItem value="mobile">mobile</UISelectItem>
                </UISelectContent>
              </UISelect>
              <div className="col-span-4 flex justify-end">
                <Button type="button" variant="outline" onClick={addPreset}>Add</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
