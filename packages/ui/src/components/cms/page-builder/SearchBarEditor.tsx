import type { SearchBarComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<SearchBarComponent>;

export default function SearchBarEditor({ component, onChange }: Props) {
  const handleInput = (
    field: keyof SearchBarComponent & string,
    value: string | number | undefined,
  ) => {
    onChange({ [field]: value } as Partial<SearchBarComponent>);
  };
  return (
    <div className="space-y-2">
      <Input
        value={component.placeholder ?? ""}
        onChange={(e) => handleInput("placeholder", e.target.value)}
        placeholder="placeholder"
      />
      <Input
        type="number"
        value={component.limit ?? ""}
        onChange={(e) =>
          handleInput(
            "limit",
            e.target.value ? Number(e.target.value) : undefined
          )
        }
        placeholder="limit"
      />
    </div>
  );
}
