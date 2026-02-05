"use client";

import Checkin from "@/components/checkins/CheckinsTable";
import Providers from "@/components/Providers";

// Disable static generation - this page requires runtime data
export const dynamic = 'force-dynamic';

export default function CheckinPage() {
  return (
    <Providers>
      <Checkin />
    </Providers>
  );
}
