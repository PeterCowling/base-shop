import type { ButtonComponent } from "@acme/types";
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
  component: ButtonComponent;
  onChange: (patch: Partial<ButtonComponent>) => void;
}

export default function ButtonEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<ButtonComponent>(onChange);
  const updateVariant = (value: string) => {
    const nextValue = value
      ? (value as ButtonComponent["variant"])
      : undefined;
    handleInput("variant", nextValue);
  };
  return (
    <>
      <input
        type="hidden"
        value={component.variant ?? ""}
        onInput={(event) => updateVariant(event.currentTarget.value)}
        onChange={(event) => updateVariant(event.currentTarget.value)}
      />
      <Input
        label="Label"
        value={component.label ?? ""}
        onChange={(e) => handleInput("label", e.target.value)}
      />
      <Input
        label="URL"
        value={component.href ?? ""}
        onChange={(e) => handleInput("href", e.target.value)}
      />
      <Select value={component.variant ?? ""} onValueChange={(v) => updateVariant(v)}>
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
