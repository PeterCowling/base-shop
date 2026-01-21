// /src/config/homepage/tasksConfig.ts

/**
 * Task configuration for the homepage DoList.
 * Images are referenced from /images/ in the public folder.
 */

/** Eligibility shape used by getTasks */
interface Eligibility {
  isEligibleForComplimentaryBreakfast: boolean;
  isEligibleForEveningDrink: boolean;
}

/** A single task's data - reduced to non-translatable info */
export interface TaskItem {
  id: string;
  to: string;
  image: string;
  isStandard: boolean;
  // title, completedTitle, note, alt are removed - they will come from i18n
}

/**
 * Returns an array of tasks for the occupant to complete.
 * The returned objects contain only the necessary data for logic,
 * display text will be handled by the component using i18next.
 *
 * @param uuid - The occupant's unique identifier
 * @param eligibility - The occupant's eligibility data
 * @param roomNumber - The occupant's room number
 */
export function getTasks(
  uuid: string,
  eligibility: Eligibility,
  roomNumber: number,
): TaskItem[] {
  const { isEligibleForComplimentaryBreakfast, isEligibleForEveningDrink } =
    eligibility;
  const tasks: TaskItem[] = [];

  // Main Door Access Task
  tasks.push({
    id: 'mainDoorAccess',
    to: `/main-door-access?uuid=${uuid}`,
    image: '/images/maindoor.webp',
    // Determine if standard based on roomNumber
    isStandard: roomNumber <= 8,
  });

  // Digital Assistant Task
  tasks.push({
    id: 'digitalAssistant',
    to: `/digital-assistant?uuid=${uuid}`,
    image: '/images/digital_assistant.png',
    isStandard: false,
  });

  // Complimentary Breakfast Task (Conditional based on eligibility)
  if (isEligibleForComplimentaryBreakfast) {
    tasks.push({
      id: 'complimentaryBreakfast',
      to: `/complimentary-breakfast?uuid=${uuid}`,
      image: '/images/breakfast.webp',
      isStandard: true,
    });
  } else {
    // Explore Breakfast Menu as a Discretionary Task
    tasks.push({
      id: 'exploreBreakfastMenu',
      to: `/breakfast-menu?uuid=${uuid}`,
      image: '/images/breakfast.webp',
      isStandard: false,
    });
  }

  // Complimentary Evening Drink Task (Conditional based on eligibility)
  if (isEligibleForEveningDrink) {
    tasks.push({
      id: 'complimentaryEveningDrink',
      to: `/complimentary-evening-drink?uuid=${uuid}`,
      image: '/images/peroni.jpg',
      isStandard: false,
    });
  }

  // Bag Storage Task
  tasks.push({
    id: 'bagStorage',
    to: `/bag-storage?uuid=${uuid}`,
    image: '/images/luggage.webp',
    isStandard: false,
  });

  return tasks;
}
