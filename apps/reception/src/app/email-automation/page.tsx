"use client";

import EmailProgress from "@/components/emailAutomation/EmailProgress";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function EmailAutomationPage() {
  return (
    <Providers>
      <EmailProgress setMessage={() => {}} />
    </Providers>
  );
}
