// apps/cms/src/app/cms/wizard/page.tsx
// Legacy wizard route retained for backwards‑compatibility. Requests are
// redirected to the configurator which replaced the wizard implementation.

import { redirect } from "next/navigation";

export default function WizardPage(): void {
  redirect("/cms/configurator");
}

