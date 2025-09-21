import type { CountdownTimerComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<CountdownTimerComponent>;

export default function CountdownTimerEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<CountdownTimerComponent>(onChange);
  return (
    <>
      <Input
        label="Target Date"
        type="datetime-local"
        value={component.targetDate ?? ""}
        onChange={(e) => handleInput("targetDate", e.target.value)}
      />
      <Input
        label="Timezone"
        value={component.timezone ?? ""}
        onChange={(e) => handleInput("timezone", e.target.value)}
      />
      <Input
        label="Completion Text"
        value={component.completionText ?? ""}
        onChange={(e) => handleInput("completionText", e.target.value)}
      />
      <Input
        label="Styles"
        value={component.styles ?? ""}
        onChange={(e) => handleInput("styles", e.target.value)}
      />
    </>
  );
}
