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
        // i18n-exempt: admin-only label in builder UI
        label="Target Date"
        type="datetime-local" /* i18n-exempt: HTML attribute value */
        value={component.targetDate ?? ""}
        onChange={(e) => handleInput("targetDate", e.target.value)}
      />
      <Input
        // i18n-exempt: admin-only label in builder UI
        label="Timezone"
        value={component.timezone ?? ""}
        onChange={(e) => handleInput("timezone", e.target.value)}
      />
      <Input
        // i18n-exempt: admin-only label in builder UI
        label="Completion Text"
        value={component.completionText ?? ""}
        onChange={(e) => handleInput("completionText", e.target.value)}
      />
      <Input
        // i18n-exempt: admin-only label in builder UI
        label="Styles"
        value={component.styles ?? ""}
        onChange={(e) => handleInput("styles", e.target.value)}
      />
    </>
  );
}
