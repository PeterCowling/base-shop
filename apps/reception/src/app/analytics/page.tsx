import AnalyticsHub from "@/components/analytics/AnalyticsHub";
import Providers from "@/components/ClientProviders";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <Providers>
      <AnalyticsHub />
    </Providers>
  );
}
