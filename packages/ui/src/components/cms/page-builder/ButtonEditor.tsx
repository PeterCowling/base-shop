import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ButtonEditor({ component, onChange }: Props) {
  return (
    <>
      <Input
        label="Label"
        value={(component as any).label ?? ""}
        onChange={(e) => onChange({ label: e.target.value } as any)}
      />
      <Input
        label="URL"
        value={(component as any).href ?? ""}
        onChange={(e) => onChange({ href: e.target.value } as any)}
      />
      <Select
        value={(component as any).variant ?? ""}
        onValueChange={(v) => onChange({ variant: v || undefined } as any)}
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

