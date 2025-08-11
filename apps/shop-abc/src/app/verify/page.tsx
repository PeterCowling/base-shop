"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCsrfToken } from "@shared-utils";
import type { VerifyInput } from "../api/account/verify/route";

export default function VerifyPage() {
  const [status, setStatus] = useState("Verifying...");
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    async function verify() {
      if (!token) {
        setStatus("Missing token");
        return;
      }
      const csrfToken = getCsrfToken();
      const body: VerifyInput = { token };
      const res = await fetch("/api/account/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken ?? "",
        },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "Account verified" : "Verification failed");
    }
    verify();
  }, [params]);

  return <p>{status}</p>;
}
