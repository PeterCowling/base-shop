import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ButtonEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs(onChange);
  return (
    <>
      <Input
        label="Label"
        value={(component as any).label ?? ""}
        onChange={(e) => handleInput("label", e.target.value)}
      />
      <Input
        label="URL"
        value={(component as any).href ?? ""}
        onChange={(e) => handleInput("href", e.target.value)}
      />
      <Select
        value={(component as any).variant ?? ""}
        onValueChange={(v) => handleInput("variant", v || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Variant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">default</SelectItem>
          <SelectItem value="outline">outline</SelectItem>
          <SelectItem value="ghost">ghost</SelectItem>
          <SelectItem value="destructive">destructive</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
