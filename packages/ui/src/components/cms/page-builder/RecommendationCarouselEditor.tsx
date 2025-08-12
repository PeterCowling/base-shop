import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function RecommendationCarouselEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Input
        label="Endpoint"
        value={(component as any).endpoint ?? ""}
        onChange={(e) => onChange({ endpoint: e.target.value })}
        placeholder="/api/recommendations"
      />
    </div>
  );
}
