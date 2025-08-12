import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function RecommendationCarouselEditor({ component, onChange }: Props) {
  const handleNum = (field: string, value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ [field]: isNaN(num!) ? undefined : num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Endpoint"
        value={(component as any).endpoint ?? ""}
        onChange={(e) => onChange({ endpoint: e.target.value } as Partial<PageComponent>)}
      />
      <Input
        label="Desktop Items"
        type="number"
        value={(component as any).desktopItems ?? ""}
        onChange={(e) => handleNum("desktopItems", e.target.value)}
      />
      <Input
        label="Tablet Items"
        type="number"
        value={(component as any).tabletItems ?? ""}
        onChange={(e) => handleNum("tabletItems", e.target.value)}
      />
      <Input
        label="Mobile Items"
        type="number"
        value={(component as any).mobileItems ?? ""}
        onChange={(e) => handleNum("mobileItems", e.target.value)}
      />
    </div>
  );
}
