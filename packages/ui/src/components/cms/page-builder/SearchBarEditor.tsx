import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function SearchBarEditor({ component, onChange }: Props) {
  const handleInput = (
    field: string,
    value: string | number | undefined
  ) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).placeholder ?? ""}
        onChange={(e) => handleInput("placeholder", e.target.value)}
        placeholder="placeholder"
      />
      <Input
        type="number"
        value={(component as any).limit ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          handleInput("limit", val === "" ? undefined : Number(val));
        }}
        placeholder="limit"
      />
    </div>
  );
}

