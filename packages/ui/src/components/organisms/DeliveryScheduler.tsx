import * as React from "react";
import { cn } from "../../utils/style";
import { Input } from "../atoms/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/primitives/select";

export interface DeliverySchedulerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  windows?: string[];
  /** Callback fired whenever the user changes any field */
  onChange?: (info: {
    mode: "delivery" | "pickup";
    date: string;
    window: string;
  }) => void;
}

export function DeliveryScheduler({
  className,
  onChange,
  ...props
}: DeliverySchedulerProps) {
  const [mode, setMode] = React.useState<"delivery" | "pickup">("delivery");
  const [date, setDate] = React.useState("");
  const [windowValue, setWindowValue] = React.useState("");
  const slots = React.useMemo(
    () =>
      windows ??
      Array.from({ length: 8 }, (_, i) => `${10 + i}-${11 + i}`),
    [windows]
  );

  const emitChange = React.useCallback(
    (next: { mode: "delivery" | "pickup"; date: string; window: string }) => {
      onChange?.(next);
    },
    [onChange]
  );

  const handleMode = (value: "delivery" | "pickup") => {
    setMode(value);
    emitChange({ mode: value, date, window: windowValue });
  };

  const handleDate = (value: string) => {
    setDate(value);
    emitChange({ mode, date: value, window: windowValue });
  };

  const handleWindow = (value: string) => {
    setWindowValue(value);
    emitChange({ mode, date, window: value });
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div>
        <label className="mb-1 block text-sm font-medium">Mode</label>
        <Select value={mode} onValueChange={handleMode}>
          <SelectTrigger>
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Date
        <Input
          type="date"
          value={date}
          onChange={(e) => handleDate(e.target.value)}
        />
      </label>
      <div>
        <label className="mb-1 block text-sm font-medium">Window</label>
        <Select value={windowValue} onValueChange={handleWindow}>
          <SelectTrigger>
            <SelectValue placeholder="Select window" />
          </SelectTrigger>
          <SelectContent>
            {slots.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
