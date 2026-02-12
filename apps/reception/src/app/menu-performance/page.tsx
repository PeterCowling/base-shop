import MenuPerformanceDashboard from "@/components/analytics/MenuPerformanceDashboard";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function MenuPerformancePage() {
  return (
    <Providers>
      <MenuPerformanceDashboard />
    </Providers>
  );
}
