import Providers from "@/components/ClientProviders";
import ManagerAuditContent from "@/components/managerAudit/ManagerAuditContent";

export const dynamic = "force-dynamic";

export default function ManagerAuditPage() {
  return (
    <Providers>
      <ManagerAuditContent />
    </Providers>
  );
}
