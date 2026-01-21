import type { RecommendationCarouselComponent } from "@acme/types";

import { Input } from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<RecommendationCarouselComponent>;

export default function RecommendationCarouselEditor({ component, onChange }: Props) {
  // i18n-exempt — internal editor labels
  /* i18n-exempt */
  const t = (s: string) => s;
  const handleNum = (field: keyof RecommendationCarouselComponent & string, value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ [field]: isNaN(num!) ? undefined : num } as Partial<RecommendationCarouselComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label={t("Endpoint")}
        value={component.endpoint ?? ""}
        onChange={(e) => onChange({ endpoint: e.target.value } as Partial<RecommendationCarouselComponent>)}
      />
      <Input
        label={t("Desktop Items")}
        type="number"
        value={component.desktopItems ?? ""}
        onChange={(e) => handleNum("desktopItems", e.target.value)}
      />
      <Input
        label={t("Tablet Items")}
        type="number"
        value={component.tabletItems ?? ""}
        onChange={(e) => handleNum("tabletItems", e.target.value)}
      />
      <Input
        label={t("Mobile Items")}
        type="number"
        value={component.mobileItems ?? ""}
        onChange={(e) => handleNum("mobileItems", e.target.value)}
      />
    </div>
  );
}
