import EmailProgress from "@/components/emailAutomation/EmailProgress";
import Providers from "@/components/Providers";

export default function EmailAutomationContent() {
  return (
    <Providers>
      <EmailProgress setMessage={() => {}} />
    </Providers>
  );
}
