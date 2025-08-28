"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { hslToHex, hexToHsl, isHsl, isHex } from "@ui/utils/colorUtils";

interface Props {
  token: string;
  defaultValue: string;
  value: string;
  x: number;
  y: number;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function InlineColorPicker({
  token,
  defaultValue,
  value,
  x,
  y,
  onChange,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.click();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const converted = isHsl(defaultValue) ? hexToHsl(raw) : raw;
    onChange(converted);
  };

  const handleClose = () => {
    onClose();
  };

  const displayValue = isHsl(value) ? hslToHex(value) : value;
  const defaultHex = isHsl(defaultValue) ? hslToHex(defaultValue) : defaultValue;

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      <div
        className="absolute"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="color"
          aria-label={token}
          value={isHex(displayValue) ? displayValue : defaultHex}
          onChange={handleChange}
          onBlur={handleClose}
        />
      </div>
    </div>
  );
}
