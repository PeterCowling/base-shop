"use client";

import Checkin from "@/components/checkins/CheckinsTable";
import Providers from "@/components/Providers";

export default function CheckinPage() {
  return (
    <Providers>
      <Checkin />
    </Providers>
  );
}
