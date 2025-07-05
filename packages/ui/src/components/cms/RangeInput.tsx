"use client";

interface RangeInputProps {
  value: string; // e.g. "16px"
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 64,
}: RangeInputProps) {
  const num = parseInt(value, 10);
  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        value={num}
        onChange={(e) => onChange(`${e.target.value}px`)}
      />
      <span className="w-10 text-right">{num}px</span>
    </>
  );
}
