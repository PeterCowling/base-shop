"use client";

import { useEffect, useState } from "react";
import { parseIsoDate } from "@acme/date-utils";

interface Props {
  /** ISO target date/time string */
  targetDate?: string;
  /** IANA timezone for the target date */
  timeZone?: string;
  /** Text displayed once countdown completes */
  completionText?: string;
  /** Optional className for styling */
  className?: string;
}

export default function CountdownTimer({
  targetDate,
  timeZone,
  completionText,
  className,
}: Props) {
  const createTarget = () => {
    if (!targetDate) return null;
    const parsed = parseIsoDate(targetDate);
    if (!parsed) return null;
    if (timeZone) {
      const tzDate = new Date(
        parsed.toLocaleString("en-US", { timeZone })
      );
      return tzDate;
    }
    return parsed;
  };

  const [remaining, setRemaining] = useState<string | null>(() => {
    const t = createTarget();
    if (!t) return null;
    return formatRemaining(t.getTime() - Date.now());
  });

  useEffect(() => {
    const target = createTarget();
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(null);
        clearInterval(id);
      } else {
        setRemaining(formatRemaining(diff));
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [targetDate, timeZone]);

  if (!targetDate) return null;
  if (remaining === null) {
    return completionText ? (
      <span className={className}>{completionText}</span>
    ) : null;
  }
  return <span className={className}>{remaining}</span>;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
