"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirect() {
  const router = useRouter();

  const goDefault = useCallback(() => {
    router.replace("/en");
  }, [router]);

  useEffect(() => {
    goDefault();
  }, [goDefault]);

  return null;
}
