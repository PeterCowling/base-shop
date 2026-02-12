import { readFile } from "fs/promises";
import { join } from "path";

import { BRIKETTE_ROOT } from "../utils/data-root.js";

// Cache for knowledge base content with TTL
interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load resource with caching
 */
async function loadCached<T>(uri: string, loader: () => Promise<T>): Promise<T> {
  const cached = cache.get(uri);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  const data = await loader();
  cache.set(uri, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearBriketteCache(): void {
  cache.clear();
}

/**
 * Brikette knowledge base resource definitions
 */
export const briketteResourceDefinitions = [
  {
    uri: "brikette://faq",
    name: "Brikette FAQ",
    description: "Frequently asked questions about Hostel Brikette (29 items covering check-in, breakfast, amenities, policies)",
    mimeType: "application/json",
  },
  {
    uri: "brikette://rooms",
    name: "Room Details",
    description: "Room types, occupancy, amenities, pricing, and availability for Hostel Brikette",
    mimeType: "application/json",
  },
  {
    uri: "brikette://pricing/menu",
    name: "Menu Pricing",
    description: "Current bar and breakfast menu prices at Hostel Brikette",
    mimeType: "application/json",
  },
  {
    uri: "brikette://policies",
    name: "Hotel Policies",
    /* eslint-disable-next-line ds/no-raw-font -- BRIK-ENG-0020 false positive: 'times' refers to check-in/out times, not font */
    description: "Check-in/out times, age restrictions, cancellation, pets, and other policies",
    mimeType: "application/json",
  },
];

/**
 * Policy-related keywords for filtering FAQ items
 */
const POLICY_KEYWORDS = [
  "check-in",
  "check-out",
  "check in",
  "check out",
  "age",
  "cancel",
  "pet",
  "child",
  "quiet",
  "payment",
  "restriction",
];

/**
 * Handle reading a Brikette knowledge resource
 */
export async function handleBriketteResourceRead(uri: string) {
  try {
    switch (uri) {
      case "brikette://faq": {
        const data = await loadCached(uri, async () => {
          const content = await readFile(
            join(BRIKETTE_ROOT, "locales", "en", "faq.json"),
            "utf-8"
          );
          return JSON.parse(content);
        });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "brikette://rooms": {
        const data = await loadCached(uri, async () => {
          // Load room translations
          const roomsLocale = await readFile(
            join(BRIKETTE_ROOT, "locales", "en", "rooms.json"),
            "utf-8"
          );

          // Room configuration is hardcoded here as we can't import TS at runtime.
          // This data is derived from apps/brikette/src/config/rooms.ts
          // TODO: Consider exposing room config as JSON or using a build step to generate this.
          const roomData = {
            locale: JSON.parse(roomsLocale),
            summary: {
              totalRoomTypes: 3,
              roomTypes: [
                {
                  sku: "DR4",
                  name: "4-Bed Mixed Dorm",
                  occupancy: 4,
                  pricingModel: "perBed",
                  basePrice: { amount: 25, currency: "EUR" },
                  totalBeds: 32,
                  amenities: ["Reading light", "Power socket", "Air-con", "Shared bathroom", "Free Wi-Fi", "Security locker"],
                },
                {
                  sku: "DR6",
                  name: "6-Bed Mixed Dorm",
                  occupancy: 6,
                  pricingModel: "perBed",
                  basePrice: { amount: 22, currency: "EUR" },
                  totalBeds: 42,
                  amenities: ["Balcony access", "Individual locker", "Reading light", "Shared bathroom", "Free Wi-Fi"],
                },
                {
                  sku: "PRD",
                  name: "Private Double Ensuite",
                  occupancy: 2,
                  pricingModel: "perRoom",
                  basePrice: { amount: 85, currency: "EUR" },
                  totalBeds: 6,
                  amenities: ["Ensuite bathroom", "Air-con", "Mini-fridge", "Desk", "Smart TV", "Towels included", "Free Wi-Fi"],
                },
              ],
              note: "Prices are base rates; seasonal pricing may apply (high season: Jun-Aug, events: Dec 24-Jan 6)",
            },
          };
          return roomData;
        });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "brikette://pricing/menu": {
        const data = await loadCached(uri, async () => {
          // Menu prices extracted from menuPricing.ts
          // Since we can't easily import TS at runtime, we hardcode the structure
          // This should be kept in sync with apps/brikette/src/data/menuPricing.ts
          return {
            bar: {
              cocktails: {
                aperolSpritz: 10,
                limoncelloSpritz: 10,
                hugoSpritz: 11,
                rossiniSpritz: 11,
                lemonStrawberryDaiquiri: 10,
                lemonStrawberryMargarita: 12.5,
                lemonDropMartini: 12.5,
              },
              wine: {
                redWhiteGlass: 5.5,
                redWhiteBottle: 20,
                proseccoGlass: 8,
              },
              beer: {
                nastro330: 5,
                peroni330: 4.5,
                nastro660: 8,
                peroni660: 7,
              },
              spirits: {
                vodka: { skyy: 8, absolut: 8, smirnoff: 10, greyGoose: 11 },
                rum: { pampero: 8, bacardiSuperior: 8, captainMorgan: 11, angosturaReserva: 12.5 },
                gin: { beefeater: 8, bombaySapphire: 10, tanqueray: 10, hendricks: 14 },
                whiskey: { jwRed: 8, jameson: 11, jackDaniels: 11, wildTurkey: 11, chivas12: 14, glenfiddich12: 18 },
                tequila: { joseCuervoSilver: 8 },
              },
              other: {
                limoncelloShot: 5.5,
                iceCream: { oneScoop: 2, twoScoops: 3, threeScoops: 3.5 },
              },
            },
            breakfast: {
              mains: {
                eggsCombo: 12.5,
                frenchToast: 12.5,
                nutellaFrenchToast: 14,
                pancakes: 12.5,
                veggieToast: 10.5,
                healthyDelight: 10,
              },
              addOns: {
                addEggComboItem: 3,
                addAdditionalSyrup: 1.5,
                addProtein: 3,
              },
              juicesAndSmoothies: {
                detoxMe: 7,
                energizeMe: 7,
                multiV: 7,
                orangeJuice: 5,
                bananaSmoothie: 8,
                strawberrySmoothie: 8,
                saltedCaramelProteinSmoothie: 11,
              },
              hotDrinks: {
                tea: 3,
                espresso: 2,
                macchiato: 3,
                americano: 3,
                cappuccino: 3.5,
                latte: 4,
                altMilk: 1.5,
              },
              coldDrinks: {
                icedLatte: 5,
                icedSoyLatte: 6,
                icedRiceLatte: 6,
                icedTea: 4,
              },
            },
            currency: "EUR",
            note: "Breakfast included with direct booking; prices may change seasonally",
          };
        });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "brikette://policies": {
        const data = await loadCached(uri, async () => {
          // Load FAQ and filter for policy-related items
          const faqContent = await readFile(
            join(BRIKETTE_ROOT, "locales", "en", "faq.json"),
            "utf-8"
          );
          const faq = JSON.parse(faqContent);

          // Filter FAQ items that relate to policies
          const policyItems = faq.items.filter((item: { question: string; answer: string }) =>
            POLICY_KEYWORDS.some((kw) =>
              item.question.toLowerCase().includes(kw) ||
              item.answer.toLowerCase().includes(kw)
            )
          );

          // Add structured policy summary
          return {
            summary: {
              checkIn: {
                regular: "15:00 - 22:30",
                lateArrival: "Must be arranged in advance",
                receptionHours: "07:30 - 22:30",
              },
              checkOut: {
                regular: "07:30 - 10:30",
                luggageStorage: "Available 10:30-15:30 for check-out guests",
              },
              ageRestrictions: {
                dorms: "18-39 years only",
                privateRooms: "No age restrictions",
                children: "Not allowed in dorms; book private rooms",
              },
              pets: "Not permitted",
              quietHours: "23:30 - 07:30",
              paymentMethods: ["Visa", "Mastercard", "Maestro", "ATM card", "Cash"],
              cancellation: "See booking terms for cancellation policy",
            },
            faqItems: policyItems,
          };
        });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: `Unknown Brikette resource: ${uri}`,
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Error reading Brikette resource ${uri}: ${errorMessage}`,
        },
      ],
    };
  }
}
