/* eslint-disable ds/min-tap-size -- BRIK-2 meal-orders tap size exception */
'use client';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioStepProps {
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
}

export function RadioStep({
  name,
  options,
  selectedValue,
  onChange,
  onNext,
  nextLabel,
  disabled = false,
}: RadioStepProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((item) => {
          const isSelected = selectedValue === item.value;

          return (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={item.value}
                checked={isSelected}
                onChange={() => onChange(item.value)}
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </label>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onNext}
        className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}
