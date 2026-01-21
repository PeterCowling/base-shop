"use client";

import { useEffect, useState } from "react";

export default function useLiveMessage() {
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 500);
    return () => clearTimeout(t);
  }, [liveMessage]);

  return { liveMessage, setLiveMessage } as const;
}

