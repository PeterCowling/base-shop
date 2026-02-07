"use client";

import EmailProgress from "@/components/emailAutomation/EmailProgress";
import Providers from "@/components/Providers";

export default function EmailAutomationPage() {
  return (
    <Providers>
      <EmailProgress setMessage={() => {}} />
    </Providers>
  );
}
