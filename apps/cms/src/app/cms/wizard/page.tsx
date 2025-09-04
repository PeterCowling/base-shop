// Legacy wizard route kept for backwards-compatibility. Users hitting
// `/cms/wizard` should be sent to the new configurator experience.
import { redirect } from "next/navigation";

export default function WizardPage() {
  redirect("/cms/configurator");
}
