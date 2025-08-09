import * as React from "react";
import { cn } from "../../utils/cn";
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
  /** Callback fired whenever the user changes any field */
  onChange?: (info: {
    mode: "delivery" | "pickup";
    date: string;
    time: string;
  }) => void;
}

export function DeliveryScheduler({
  className,
  onChange,
  ...props
}: DeliverySchedulerProps) {
  const [mode, setMode] = React.useState<"delivery" | "pickup">("delivery");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");

  const emitChange = React.useCallback(
    (next: { mode: "delivery" | "pickup"; date: string; time: string }) => {
      onChange?.(next);
    },
    [onChange]
  );

  const handleMode = (value: "delivery" | "pickup") => {
    setMode(value);
    emitChange({ mode: value, date, time });
  };

  const handleDate = (value: string) => {
    setDate(value);
    emitChange({ mode, date: value, time });
  };

  const handleTime = (value: string) => {
    setTime(value);
    emitChange({ mode, date, time: value });
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
      <label className="flex flex-col gap-1 text-sm">
        Time
        <Input
          type="time"
          value={time}
          onChange={(e) => handleTime(e.target.value)}
        />
      </label>
    </div>
  );
}
