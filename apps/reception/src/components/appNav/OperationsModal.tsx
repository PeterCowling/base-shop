import {
  Bed,
  CalendarPlus,
  DoorOpen,
  GlassWater,
  Inbox,
  Lock,
  LogIn,
} from "lucide-react";

import { withIconModal } from "../../hoc/withIconModal";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  { label: "Bar",            icon: GlassWater,  route: "/bar" },
  { label: "Check-in",       icon: LogIn,        route: "/checkin" },
  { label: "Rooms",          icon: Bed,          route: "/rooms-grid" },
  { label: "Check-out",      icon: DoorOpen,     route: "/checkout" },
  { label: "Loans",          icon: Lock,         route: "/loan-items" },
  { label: "Extension",      icon: CalendarPlus, route: "/extension" },
  { label: "Prime Requests", icon: Inbox,        route: "/prime-requests" },
];

export default withIconModal({
  label: "OPERATIONS",
  actions,
});
