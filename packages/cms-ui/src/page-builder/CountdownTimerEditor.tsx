import { useTranslations } from "@acme/i18n";
import type { CountdownTimerComponent } from "@acme/types";

import { Input } from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";
import useComponentInputs from "./useComponentInputs";

type Props = EditorProps<CountdownTimerComponent>;

export default function CountdownTimerEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<CountdownTimerComponent>(onChange);
  const t = useTranslations();
  return (
    <>
      <Input
        label={t("cms.builder.countdown.targetDate.label")}
        // i18n-exempt -- TECH-123 [ttl=2099-12-31] HTML attribute value
        type="datetime-local"
        value={component.targetDate ?? ""}
        onChange={(e) => handleInput("targetDate", e.target.value)}
      />
      <Input
        label={t("cms.builder.countdown.timezone.label")}
        value={component.timezone ?? ""}
        onChange={(e) => handleInput("timezone", e.target.value)}
      />
      <Input
        label={t("cms.builder.countdown.completionText.label")}
        value={component.completionText ?? ""}
        onChange={(e) => handleInput("completionText", e.target.value)}
      />
      <Input
        label={t("cms.builder.countdown.styles.label")}
        value={component.styles ?? ""}
        onChange={(e) => handleInput("styles", e.target.value)}
      />
    </>
  );
}
