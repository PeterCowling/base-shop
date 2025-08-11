import { useEffect, useState } from "react";

interface Props {
  targetDate?: string;
  timezone?: string;
  completionText?: string;
  styles?: string;
  children?: React.ReactNode;
}

function getTargetDate(targetDate?: string, timezone?: string) {
  if (!targetDate) return null;
  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return null;
  if (timezone) {
    const localized = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return localized;
  }
  return date;
}

export default function CountdownTimer({
  targetDate,
  timezone,
  completionText,
  styles,
}: Props) {
  const target = getTargetDate(targetDate, timezone);
  const [remaining, setRemaining] = useState(() =>
    target ? target.getTime() - Date.now() : 0
  );

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      setRemaining(target.getTime() - Date.now());
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [targetDate, timezone]);

  if (!target) return null;

  if (remaining <= 0) {
    return completionText ? <div className={styles}>{completionText}</div> : null;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [] as string[];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return <div className={styles}>{parts.join(" ")}</div>;
}

