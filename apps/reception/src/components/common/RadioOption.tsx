import React, { memo } from "react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@acme/design-system";

interface RadioOptionProps<T extends string> {
  label: string;
  value: T;
  icon: LucideIcon;
  iconClass?: string;
  currentValue: T;
  onChange: () => void;
  name: string;
  activeClassName?: string;
}

function RadioOptionInner<T extends string>({
  label,
  value,
  icon,
  iconClass,
  currentValue,
  onChange,
  name,
  activeClassName = "bg-surface-3",
}: RadioOptionProps<T>) {
  const isActive = currentValue === value;
  return (
    <label
      className={`flex items-center gap-2 border rounded-lg p-2 hover:bg-surface-2 ${
        isActive ? activeClassName : ""
      }`}
    >
      <Input
        compatibilityMode="no-wrapper"
        type="radio"
        name={name}
        value={value}
        checked={isActive}
        onChange={onChange}
        className="sr-only"
      />
      {React.createElement(icon, { size: 16, className: iconClass })}
      {label}
    </label>
  );
}

export const RadioOption = memo(RadioOptionInner) as <T extends string>(
  props: RadioOptionProps<T>
) => React.ReactElement;
