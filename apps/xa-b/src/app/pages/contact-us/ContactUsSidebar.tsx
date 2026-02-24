import { SupportSidebarNav } from "@acme/ui/components/organisms/SupportSidebarNav";

import { customerServiceSidebarLinks } from "./content";

export function ContactUsSidebar({ activeHref }: { activeHref: string }) {
  return (
    <SupportSidebarNav
      activeHref={activeHref}
      title="Customer Service"
      items={[...customerServiceSidebarLinks]}
      variant="pill"
    />
  );
}
