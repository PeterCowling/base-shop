import Providers from "@/components/Providers";
import RealTimeDashboard from "@/components/reports/RealTimeDashboard";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function RealTimeDashboardPage() {
  return (
    <Providers>
      <RealTimeDashboard />
    </Providers>
  );
}
