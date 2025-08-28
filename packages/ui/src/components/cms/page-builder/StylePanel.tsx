import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "@ui/hooks/useContrastWarnings";

interface StyleOverrides {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string;
}

interface Props {
  value: StyleOverrides;
  onChange: (value: StyleOverrides) => void;
}

function StylePanel({ value, onChange }: Props) {
  const t = useTranslations();
  const warning = useContrastWarnings(value.color, value.backgroundColor);

  const handle = (key: keyof StyleOverrides) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: e.target.value });

  return (
    <div>
      <label>
        {t("cms.style.foreground")}
        <input
          aria-label={t("cms.style.foreground")}
          value={value.color || ""}
          onChange={handle("color")}
        />
      </label>
      <label>
        {t("cms.style.background")}
        <input
          aria-label={t("cms.style.background")}
          value={value.backgroundColor || ""}
          onChange={handle("backgroundColor")}
        />
      </label>
      <label>
        {t("cms.style.border")}
        <input
          aria-label={t("cms.style.border")}
          value={value.borderColor || ""}
          onChange={handle("borderColor")}
        />
      </label>
      <label>
        {t("cms.style.fontFamily")}
        <input
          aria-label={t("cms.style.fontFamily")}
          value={value.fontFamily || ""}
          onChange={handle("fontFamily")}
        />
      </label>
      <label>
        {t("cms.style.fontSize")}
        <input
          aria-label={t("cms.style.fontSize")}
          value={value.fontSize || ""}
          onChange={handle("fontSize")}
        />
      </label>
      <label>
        {t("cms.style.fontWeight")}
        <input
          aria-label={t("cms.style.fontWeight")}
          value={value.fontWeight?.toString() || ""}
          onChange={handle("fontWeight")}
        />
      </label>
      <label>
        {t("cms.style.lineHeight")}
        <input
          aria-label={t("cms.style.lineHeight")}
          value={value.lineHeight || ""}
          onChange={handle("lineHeight")}
        />
      </label>
      {warning && (
        <div role="alert" aria-live="polite">
          {t("cms.style.lowContrast")}
        </div>
      )}
    </div>
  );
}

export default StylePanel;
