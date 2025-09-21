import type { RecommendationCarouselComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<RecommendationCarouselComponent>;

export default function RecommendationCarouselEditor({ component, onChange }: Props) {
  const handleNum = (field: keyof RecommendationCarouselComponent & string, value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ [field]: isNaN(num!) ? undefined : num } as Partial<RecommendationCarouselComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Endpoint"
        value={component.endpoint ?? ""}
        onChange={(e) => onChange({ endpoint: e.target.value } as Partial<RecommendationCarouselComponent>)}
      />
      <Input
        label="Desktop Items"
        type="number"
        value={component.desktopItems ?? ""}
        onChange={(e) => handleNum("desktopItems", e.target.value)}
      />
      <Input
        label="Tablet Items"
        type="number"
        value={component.tabletItems ?? ""}
        onChange={(e) => handleNum("tabletItems", e.target.value)}
      />
      <Input
        label="Mobile Items"
        type="number"
        value={component.mobileItems ?? ""}
        onChange={(e) => handleNum("mobileItems", e.target.value)}
      />
    </div>
  );
}
