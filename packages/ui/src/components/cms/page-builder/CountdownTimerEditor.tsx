import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CountdownTimerEditor({ component, onChange }: Props) {
  return (
    <>
      <Input
        label="Target Date"
        type="datetime-local"
        value={(component as any).targetDate ?? ""}
        onChange={(e) => onChange({ targetDate: e.target.value } as any)}
      />
      <Input
        label="Timezone"
        value={(component as any).timezone ?? ""}
        onChange={(e) => onChange({ timezone: e.target.value } as any)}
      />
      <Input
        label="Completion Text"
        value={(component as any).completionText ?? ""}
        onChange={(e) => onChange({ completionText: e.target.value } as any)}
      />
      <Input
        label="Styles"
        value={(component as any).styles ?? ""}
        onChange={(e) => onChange({ styles: e.target.value } as any)}
      />
    </>
  );
}

