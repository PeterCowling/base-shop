// packages/ui/src/components/cms/page-builder/TypographyEditor.tsx
"use client";

import { Input } from "@acme/design-system/shadcn";

export interface TypographyValues {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
}

export default function TypographyEditor({
  base,
  desktop,
  tablet,
  mobile,
  labels,
  onBase,
  onBp,
}: {
  base: TypographyValues;
  desktop?: TypographyValues;
  tablet?: TypographyValues;
  mobile?: TypographyValues;
  labels: {
    base: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string };
    desktop: { heading: string; fontSize: string; lineHeight: string };
    tablet: { heading: string; fontSize: string; lineHeight: string };
    mobile: { heading: string; fontSize: string; lineHeight: string };
  };
  onBase: (key: keyof TypographyValues, value: string) => void;
  onBp: (bp: 'Desktop' | 'Tablet' | 'Mobile', key: 'fontSize' | 'lineHeight', value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Input label={labels.base.fontFamily} value={base.fontFamily ?? ""} onChange={(e) => onBase('fontFamily', e.target.value)} />
      <Input label={labels.base.fontSize} value={base.fontSize ?? ""} onChange={(e) => onBase('fontSize', e.target.value)} />
      <Input label={labels.base.fontWeight} value={base.fontWeight ?? ""} onChange={(e) => onBase('fontWeight', e.target.value)} />
      <Input label={labels.base.lineHeight} value={base.lineHeight ?? ""} onChange={(e) => onBase('lineHeight', e.target.value)} />

      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{labels.desktop.heading}</div>
        <Input label={labels.desktop.fontSize} value={desktop?.fontSize ?? ""} onChange={(e) => onBp('Desktop', 'fontSize', e.target.value)} />
        <Input label={labels.desktop.lineHeight} value={desktop?.lineHeight ?? ""} onChange={(e) => onBp('Desktop', 'lineHeight', e.target.value)} />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{labels.tablet.heading}</div>
        <Input label={labels.tablet.fontSize} value={tablet?.fontSize ?? ""} onChange={(e) => onBp('Tablet', 'fontSize', e.target.value)} />
        <Input label={labels.tablet.lineHeight} value={tablet?.lineHeight ?? ""} onChange={(e) => onBp('Tablet', 'lineHeight', e.target.value)} />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{labels.mobile.heading}</div>
        <Input label={labels.mobile.fontSize} value={mobile?.fontSize ?? ""} onChange={(e) => onBp('Mobile', 'fontSize', e.target.value)} />
        <Input label={labels.mobile.lineHeight} value={mobile?.lineHeight ?? ""} onChange={(e) => onBp('Mobile', 'lineHeight', e.target.value)} />
      </div>
    </div>
  );
}

