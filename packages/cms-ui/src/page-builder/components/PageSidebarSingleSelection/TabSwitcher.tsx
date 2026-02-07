import { Inline } from "@acme/design-system/primitives/Inline";

interface TabSwitcherProps {
  value: "design" | "anim" | "content" | "cms";
  onChange: (value: "design" | "anim" | "content" | "cms") => void;
}

// i18n-exempt -- PB-2411: editor-only tab labels
const tabs: ReadonlyArray<["design" | "anim" | "content" | "cms", string]> = [
  ["design", "Design"],
  ["anim", "Animations"],
  ["content", "Content"],
  ["cms", "CMS"],
];

const TabSwitcher = ({ value, onChange }: TabSwitcherProps) => (
  <Inline className="mt-1" gap={1} alignY="center">
    {tabs.map(([key, label]) => (
      <button
        key={key}
        type="button"
        className={`rounded px-2 py-1 text-xs ${value === key ? "bg-muted font-medium" : "border"}` /* i18n-exempt -- PB-2411: style tokens, not user copy */}
        onClick={() => onChange(key)}
      >
        {/* i18n-exempt -- PB-2411: editor-only tab label */}
        {label}
      </button>
    ))}
  </Inline>
);

export default TabSwitcher;
