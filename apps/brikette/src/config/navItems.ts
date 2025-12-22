/* src/config/navItems.ts */
// Shared list of navigation keys used across header and footer

// Order matters: header, footer, and mobile menus use this shared list.
export const NAV_ITEMS = [
  "home",
  "rooms",
  "experiences",
  "howToGetHere",
  "deals",
  "assistance", // exposed to users as "Help" via translations
] as const;

export type NavKey = (typeof NAV_ITEMS)[number];
