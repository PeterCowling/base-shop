import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CountdownTimerEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <>
      <Input
        label="Target Date"
        type="datetime-local"
        value={(component as any).targetDate ?? ""}
        onChange={(e) => handleInput("targetDate", e.target.value)}
      />
      <Input
        label="Timezone"
        value={(component as any).timezone ?? ""}
        onChange={(e) => handleInput("timezone", e.target.value)}
      />
      <Input
        label="Completion Text"
        value={(component as any).completionText ?? ""}
        onChange={(e) => handleInput("completionText", e.target.value)}
      />
      <Input
        label="Styles"
        value={(component as any).styles ?? ""}
        onChange={(e) => handleInput("styles", e.target.value)}
      />
    </>
  );
}
