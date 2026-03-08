import type { LucideIcon } from "lucide-react";

import type { UserRole } from "../domains/userDomain";

export interface ModalAction {
  label: string;
  icon: LucideIcon;
  route: string;
  permission?: UserRole[];
  peteOnly?: boolean;
}
