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
import type { FormEvent } from "react";

interface Props {
  component: ButtonComponent;
  onChange: (patch: Partial<ButtonComponent>) => void;
}

export default function ButtonEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<ButtonComponent>(onChange);
  const handleHiddenVariantInput = (event: FormEvent<HTMLInputElement>) => {
    const rawValue = event.currentTarget.value;
    handleInput(
      "variant",
      rawValue ? (rawValue as ButtonComponent["variant"]) : undefined,
    );
  };
  return (
    <>
      <input
        type="hidden"
        aria-hidden="true"
        value={component.variant ?? ""}
        onInput={handleHiddenVariantInput}
        onChange={handleHiddenVariantInput}
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
      <Select
        value={component.variant ?? ""}
        onValueChange={(v) =>
          handleInput("variant", (v || undefined) as ButtonComponent["variant"])
        }
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
