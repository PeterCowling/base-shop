/* /src/components/rooms/FacilityIcon.tsx */
import { memo } from "react";
import {
  Archive,
  Bath,
  BedDouble,
  Eye,
  HelpCircle,
  Home,
  KeyRound,
  type LucideIcon,
  Sun,
  Users,
} from "lucide-react";

import type { FacilityKey } from "@/lib/facilities";

const iconMap: Record<FacilityKey, LucideIcon> = {
  privateRoom: Home,
  mixedDorm: Users,
  femaleDorm: Users,
  doubleBed: BedDouble,
  singleBeds: BedDouble,
  bathroomEnsuite: Bath,
  bathroomShared: Bath,
  seaView: Eye,
  gardenView: Eye,
  airCon: Sun,
  keycard: KeyRound,
  linen: Archive,
};

/**
 * Renders the correct Lucide icon for a facility key.
 * Small icons follow the Terracotta accent colour.
 */
function FacilityIcon({ facility }: { facility: FacilityKey }): JSX.Element {
  const Icon = iconMap[facility] ?? HelpCircle;

  return (
    <Icon
      size={18}
      className="shrink-0 text-brand-terra"
      aria-hidden="true"
      /* Terracotta Roof */
    />
  );
}

export default memo(FacilityIcon);
