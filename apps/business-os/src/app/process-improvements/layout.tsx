import type { ReactNode } from "react";

import { ProcessImprovementsSubNav } from "@/components/process-improvements/ProcessImprovementsSubNav";

export default function ProcessImprovementsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cmd-centre">
      <ProcessImprovementsSubNav />
      {children}
    </div>
  );
}
