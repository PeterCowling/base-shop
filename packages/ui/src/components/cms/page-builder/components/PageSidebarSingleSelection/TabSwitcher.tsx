interface TabSwitcherProps {
  value: "design" | "anim" | "content" | "cms";
  onChange: (value: "design" | "anim" | "content" | "cms") => void;
}

const tabs: ReadonlyArray<["design" | "anim" | "content" | "cms", string]> = [
  ["design", "Design"],
  ["anim", "Animations"],
  ["content", "Content"],
  ["cms", "CMS"],
];

const TabSwitcher = ({ value, onChange }: TabSwitcherProps) => (
  <div className="mt-1 flex items-center gap-1">
    {tabs.map(([key, label]) => (
      <button
        key={key}
        type="button"
        className={`rounded px-2 py-1 text-xs ${value === key ? "bg-muted font-medium" : "border"}`}
        onClick={() => onChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default TabSwitcher;
