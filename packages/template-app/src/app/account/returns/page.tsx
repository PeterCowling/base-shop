import { getReturnLogistics } from "@platform-core/returnLogistics";
import React from "react";

export const metadata = { title: "Return Pickup" };

export default async function ReturnsPage() {
  const cfg = await getReturnLogistics();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Schedule Return Pickup</h1>
      <PickupForm allowed={cfg.homePickupZipCodes} />
    </div>
  );
}

function PickupForm({ allowed }: { allowed: string[] }) {
  "use client";

  const [zip, setZip] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowed.includes(zip)) {
      setMessage("ZIP not eligible for pickup");
      return;
    }
    const res = await fetch("/api/return", {
      method: "POST",
      body: JSON.stringify({ zip, date, time }),
    });
    setMessage(res.ok ? "Pickup scheduled" : "Failed to schedule pickup");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="border p-2 block w-full"
        placeholder="ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
      />
      <input
        type="date"
        className="border p-2 block w-full"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="time"
        className="border p-2 block w-full"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-white"
      >
        Schedule
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

