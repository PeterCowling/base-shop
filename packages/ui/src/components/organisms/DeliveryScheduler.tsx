"use client";

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
  /** Callback fired whenever the user changes any field */
  onChange?: (info: {
    mode: "delivery" | "pickup";
    date: string;
    region?: string;
    window?: string;
  }) => void;
  /** Optional regions eligible for premier delivery */
  regions?: string[];
  /** Optional preset windows (e.g. `10-11`, `11-12`) */
  windows?: string[];
}

export function DeliveryScheduler({
  className,
  onChange,
  regions,
  windows,
  ...props
}: DeliverySchedulerProps) {
  const [mode, setMode] = React.useState<"delivery" | "pickup">("delivery");
  const [date, setDate] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [win, setWin] = React.useState("");

  const emitChange = React.useCallback(
    (next: {
      mode: "delivery" | "pickup";
      date: string;
      region?: string;
      window?: string;
    }) => {
      onChange?.(next);
    },
    [onChange]
  );

  const handleMode = (value: "delivery" | "pickup") => {
    setMode(value);
    emitChange({ mode: value, date, region, window: win });
  };

  const handleDate = (value: string) => {
    setDate(value);
    emitChange({ mode, date: value, region, window: win });
  };

  const handleTime = (value: string) => {
    setWin(value);
    emitChange({ mode, date, region, window: value });
  };
  const handleRegion = (value: string) => {
    setRegion(value);
    emitChange({ mode, date, region: value, window: win });
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
      {regions && regions.length ? (
        <div>
          <label className="mb-1 block text-sm font-medium">Region</label>
          <Select value={region} onValueChange={handleRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {windows && windows.length ? "Window" : "Time"}
        {windows && windows.length ? (
          <Select value={win} onValueChange={handleTime}>
            <SelectTrigger>
              <SelectValue placeholder="Select window" />
            </SelectTrigger>
            <SelectContent>
              {windows.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="time"
            value={win}
            onChange={(e) => handleTime(e.target.value)}
          />
        )}
      </label>
    </div>
  );
}
