"use client";

import Providers from "@/components/Providers";
import EmailProgress from "@/components/emailAutomation/EmailProgress";

export default function EmailAutomationPage() {
  return (
    <Providers>
      <EmailProgress setMessage={() => {}} />
    </Providers>
  );
}
