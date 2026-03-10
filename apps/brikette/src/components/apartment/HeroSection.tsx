// src/components/apartment/HeroSection.tsx
import type { ComponentProps } from "react";

import ApartmentHeroSection from "@acme/ui/organisms/ApartmentHeroSection";

export type HeroSectionProps = ComponentProps<typeof ApartmentHeroSection>;

const HeroSection = ApartmentHeroSection;

export default HeroSection;
export { HeroSection };

/*
  Hero banner for the apartment page.
  - When `bookingUrl` is provided, the call to action links to that URL.
  - Without it, clicking the button opens the booking modal.
*/

// moved implementation into @acme/ui
