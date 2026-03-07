import Providers from "@/components/ClientProviders";
import InboxWorkspace from "@/components/inbox/InboxWorkspace";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return (
    <Providers>
      <InboxWorkspace />
    </Providers>
  );
}
