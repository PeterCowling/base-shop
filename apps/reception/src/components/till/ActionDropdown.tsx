import { FC, useEffect, useRef } from "react";

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

  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown if a click occurs outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpenId]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpenId(open ? null : id)}
        className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark dark:bg-darkSurface"
      >
        {label}
      </button>
      {open && (
        <ul className="absolute left-0 mt-1 w-40 bg-white border rounded shadow z-10 dark:bg-darkSurface">
          {options.map((opt) => (
            <li key={opt.label}>
              <button
                onClick={() => {
                  setOpenId(null);
                  opt.onClick();
                }}
                disabled={opt.disabled}
                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50 dark:bg-darkSurface`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActionDropdown;
