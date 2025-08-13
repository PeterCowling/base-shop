// packages/ui/src/components/cms/page-builder/SocialProofEditor.tsx
import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SocialProofEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string | number | undefined) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).source ?? ""}
        onChange={(e) => handleInput("source", e.target.value)}
        placeholder="data source URL"
      />
      <Input
        type="number"
        value={(component as any).frequency ?? ""}
        onChange={(e) =>
          handleInput(
            "frequency",
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        placeholder="frequency (ms)"
      />
    </div>
  );
}

