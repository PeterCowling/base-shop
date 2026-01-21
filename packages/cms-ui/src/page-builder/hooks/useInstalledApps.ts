"use client";

import { useEffect, useState } from "react";

import { listInstalledApps, subscribeInstalledApps } from "../appInstallStore";

export default function useInstalledApps(shop: string | null | undefined) {
  const [installedApps, setInstalledApps] = useState<string[]>(() => listInstalledApps(shop ?? null));

  useEffect(() => {
    setInstalledApps(listInstalledApps(shop ?? null));
    return subscribeInstalledApps(shop ?? null, (apps) => setInstalledApps(apps));
  }, [shop]);

  return installedApps;
}

