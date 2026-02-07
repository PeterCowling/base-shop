import { type FC } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/design-system/primitives";

interface DropdownOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionDropdownProps {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  label: string;
  options: DropdownOption[];
}

const ActionDropdown: FC<ActionDropdownProps> = ({
  id,
  openId,
  setOpenId,
  label,
  options,
}) => {
  const open = openId === id;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => setOpenId(next ? id : null)}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark dark:bg-darkSurface"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.label}
            disabled={opt.disabled}
            onSelect={(event) => {
              event.preventDefault();
              setOpenId(null);
              if (!opt.disabled) opt.onClick();
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionDropdown;
