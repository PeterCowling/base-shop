// /src/config/homepage/servicesConfig.ts

/**
 * Service card configuration for the homepage.
 * Images are referenced from /images/ in the public folder.
 */

/** Eligibility shape used by getServicesConfig */
interface Eligibility {
  isEligibleForComplimentaryBreakfast: boolean;
  isEligibleForEveningDrink: boolean;
}

/**
 * A single service card's data - reduced to non-translatable info.
 * Text (title, description, alt) will be fetched via i18next in the component.
 */
export interface ServiceCardData {
  id: string;
  image: string;
  to: string;
  visible: boolean;
}

/**
 * Returns an array of service card data objects for the homepage.
 * Visibility logic remains, but text content is removed.
 *
 * @param uuid - The occupant's unique identifier
 * @param eligibility - The occupant's eligibility for drinks/breakfast
 * @param completedTasks - Array of task IDs the occupant has completed
 */
export function getServicesConfig(
  uuid: string,
  eligibility: Eligibility,
  completedTasks: string[],
): ServiceCardData[] {
  const { isEligibleForComplimentaryBreakfast, isEligibleForEveningDrink } =
    eligibility;

  const serviceCards: ServiceCardData[] = [
    {
      id: 'mainDoorService',
      image: '/images/maindoor.webp',
      to: `/main-door-access?uuid=${uuid}`,
      // Visibility logic based on *task* completion
      visible: !completedTasks.includes('mainDoorAccess'),
    },
    {
      id: 'overnightIssues',
      image: '/images/error.webp',
      to: `/overnight-issues?uuid=${uuid}`,
      visible: true,
    },
    {
      id: 'digitalAssistantService',
      image: '/images/digital_assistant.png',
      to: `/digital-assistant?uuid=${uuid}`,
      // Show if the initial 'digitalAssistant' task is done
      visible: completedTasks.includes('digitalAssistant'),
    },
    {
      id: 'barMenu',
      image: '/images/compDrink.webp',
      to: `/bar-menu?uuid=${uuid}`,
      // Visibility logic: show if complimentary drink task is done OR if not eligible
      visible:
        completedTasks.includes('complimentaryEveningDrink') ||
        !isEligibleForEveningDrink,
    },
    {
      id: 'breakfastMenu',
      image: '/images/breakfast.webp',
      to: `/breakfast-menu?uuid=${uuid}`,
      // Visibility logic: show if complimentary breakfast task is done OR if not eligible
      visible:
        completedTasks.includes('complimentaryBreakfast') ||
        !isEligibleForComplimentaryBreakfast,
    },
    {
      id: 'eveningDrink',
      image: '/images/compDrink.webp',
      to: `/complimentary-evening-drink?uuid=${uuid}`,
      // Show if completed, as a reminder/link
      visible: completedTasks.includes('complimentaryEveningDrink'),
    },
    {
      id: 'complimentaryBreakfastService',
      image: '/images/breakfast.webp',
      to: `/complimentary-breakfast?uuid=${uuid}`,
      // Show if completed
      visible: completedTasks.includes('complimentaryBreakfast'),
    },
  ];

  // Filter out any cards explicitly marked as not visible
  return serviceCards.filter((card) => card.visible);
}
