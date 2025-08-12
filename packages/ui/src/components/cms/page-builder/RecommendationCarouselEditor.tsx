import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function RecommendationCarouselEditor({
  component,
  onChange,
}: Props) {
  const handle = (
    field: string,
    value: string | number | undefined
  ) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Endpoint"
        value={(component as any).endpoint ?? ""}
        onChange={(e) => handle("endpoint", e.target.value)}
      />
      <Input
        label="Desktop Items"
        type="number"
        value={(component as any).desktopItems ?? ""}
        onChange={(e) =>
          handle(
            "desktopItems",
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        min={0}
      />
      <Input
        label="Tablet Items"
        type="number"
        value={(component as any).tabletItems ?? ""}
        onChange={(e) =>
          handle(
            "tabletItems",
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        min={0}
      />
      <Input
        label="Mobile Items"
        type="number"
        value={(component as any).mobileItems ?? ""}
        onChange={(e) =>
          handle(
            "mobileItems",
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        min={0}
      />
    </div>
  );
}

