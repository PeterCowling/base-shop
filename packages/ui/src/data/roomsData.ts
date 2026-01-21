// src/data/roomsData.ts
/* =======================================================================
   Single “source-of-truth” for every room: marketing copy, images,
   live Octorate rate-plan IDs and machine-layer attributes.
   ===================================================================== */
import type {
  Availability,
  Money,
  RoomCategory,
  SeasonalPrice,
} from "@acme/ui/types/machine-layer/ml.ts";

/* ─── helpers & local types ──────────────────────────────────────────── */
export type RoomId =
  | "double_room"
  | "room_10"
  | "room_11"
  | "room_12"
  | "room_3"
  | "room_4"
  | "room_5"
  | "room_6"
  | "room_9"
  | "room_8";

export interface RateCodes {
  direct: { nr: string; flex: string };
  ota: { nr: string; flex: string };
}

/** Room extends RoomCategory but drops localisation fields handled elsewhere. */
export interface Room extends Omit<RoomCategory, "images" | "name" | "description" | "amenities"> {
  id: RoomId;
  widgetRoomCode: string;
  widgetRateCodeNR: string;
  widgetRateCodeFlex: string;
  rateCodes: RateCodes;
  imagesRaw: string[];
  landingImage: string;
  roomsHref: string;
}

const SEASONAL: SeasonalPrice[] = [
  {
    season: "high",
    start: "2025-06-01",
    end: "2025-08-31",
    price: { amount: 1, currency: "EUR" } as Money,
  },
  {
    season: "event",
    start: "2025-12-24",
    end: "2026-01-06",
    price: { amount: 1, currency: "EUR" },
  },
];

/* ─── catalogue ──────────────────────────────────────────────────────── */
const roomsData: Room[] = [
  /* ── Room 7 → double_room ─────────────────────────────────────────── */
  {
    id: "double_room",
    sku: "double_room",
    widgetRoomCode: "7",
    widgetRateCodeNR: "433883",
    widgetRateCodeFlex: "433894",
    rateCodes: {
      direct: { nr: "433883", flex: "433894" },
      ota: { nr: "433491", flex: "434398" },
    },
    occupancy: 2,
    pricingModel: "perRoom",
    basePrice: { amount: 259.2, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 2, defaultRelease: 2 } as Availability,
    imagesRaw: [
      "/images/7/landing.webp",
      "/images/7/7_1.webp",
      "/images/7/7_2.webp",
      "/images/7/7_3.webp",
    ],
    landingImage: "/images/7/landing.webp",
    roomsHref: "/rooms#double_room",
  },

  /* ── Room 10 → room_10 ────────────────────────────────────────────── */
  {
    id: "room_10",
    sku: "room_10",
    widgetRoomCode: "10",
    widgetRateCodeNR: "433887",
    widgetRateCodeFlex: "433898",
    rateCodes: {
      direct: { nr: "433887", flex: "433898" },
      ota: { nr: "614773", flex: "434404" },
    },
    occupancy: 6,
    pricingModel: "perBed",
    basePrice: { amount: 60.75, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 6, defaultRelease: 6 },
    imagesRaw: ["/images/10/landing.webp", "/images/10/10_1.webp", "/images/10/10_2.webp"],
    landingImage: "/images/10/landing.webp",
    roomsHref: "/rooms#room_10",
  },

  /* ── Room 11 → room_11 ───────────────────────────────────────────── */
  {
    id: "room_11",
    sku: "room_11",
    widgetRoomCode: "11",
    widgetRateCodeNR: "433888",
    widgetRateCodeFlex: "433899",
    rateCodes: {
      direct: { nr: "433888", flex: "433899" },
      ota: { nr: "614774", flex: "434405" },
    },
    occupancy: 6,
    pricingModel: "perBed",
    basePrice: { amount: 72.4, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 6, defaultRelease: 6 },
    imagesRaw: [
      "/images/11/landing.webp",
      "/images/11/11_1.webp",
      "/images/11/11_2.webp",
      "/images/11/11_3.webp",
      "/images/11/11_4.webp",
      "/images/11/11_5.webp",
    ],
    landingImage: "/images/11/landing.webp",
    roomsHref: "/rooms#room_11",
  },

  /* ── Room 12 → room_12 ───────────────────────────────────────────── */
  {
    id: "room_12",
    sku: "room_12",
    widgetRoomCode: "12",
    widgetRateCodeNR: "433889",
    widgetRateCodeFlex: "433900",
    rateCodes: {
      direct: { nr: "433889", flex: "433900" },
      ota: { nr: "614775", flex: "434406" },
    },
    occupancy: 6,
    pricingModel: "perBed",
    basePrice: { amount: 74.4, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 6, defaultRelease: 6 },
    imagesRaw: [
      "/images/12/landing.webp",
      "/images/12/12_1.webp",
      "/images/12/12_2.webp",
      "/images/12/12_3.webp",
      "/images/12/12_4.webp",
      "/images/12/12_5.webp",
      "/images/12/12_6.webp",
    ],
    landingImage: "/images/12/landing.webp",
    roomsHref: "/rooms#room_12",
  },

  /* ── Room 3 → room_3 ─────────────────────────────────────────────── */
  {
    id: "room_3",
    sku: "room_3",
    widgetRoomCode: "3",
    widgetRateCodeNR: "433821",
    widgetRateCodeFlex: "433892",
    rateCodes: {
      direct: { nr: "433821", flex: "433892" },
      ota: { nr: "433488", flex: "433940" },
    },
    occupancy: 8,
    pricingModel: "perBed",
    basePrice: { amount: 55.0, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 8, defaultRelease: 8 },
    imagesRaw: [
      "/images/3/landing.webp",
      "/images/4/4_1.webp",
      "/images/4/4_2.webp",
      "/images/4/4_3.webp",
    ],
    landingImage: "/images/3/landing.webp",
    roomsHref: "/rooms#room_3",
  },

  /* ── Room 4 → room_4 ─────────────────────────────────────────────── */
  {
    id: "room_4",
    sku: "room_4",
    widgetRoomCode: "4",
    widgetRateCodeNR: "433882",
    widgetRateCodeFlex: "433893",
    rateCodes: {
      direct: { nr: "433882", flex: "433893" },
      ota: { nr: "433490", flex: "434397" },
    },
    occupancy: 8,
    pricingModel: "perBed",
    basePrice: { amount: 55.0, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 8, defaultRelease: 8 },
    imagesRaw: ["/images/4/4_1.webp", "/images/4/4_2.webp", "/images/4/4_3.webp"],
    landingImage: "/images/4/landing.webp",
    roomsHref: "/rooms#room_4",
  },

  /* ── Room 5 → room_5 ─────────────────────────────────────────────── */
  {
    id: "room_5",
    sku: "room_5",
    widgetRoomCode: "5",
    widgetRateCodeNR: "433884",
    widgetRateCodeFlex: "433895",
    rateCodes: {
      direct: { nr: "433884", flex: "433895" },
      ota: { nr: "614788", flex: "434401" },
    },
    occupancy: 6,
    pricingModel: "perBed",
    basePrice: { amount: 66.5, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 6, defaultRelease: 6 },
    imagesRaw: [
      "/images/5/landing.webp",
      "/images/6/6_1.webp",
      "/images/6/6_2.webp",
      "/images/6/6_3.webp",
      "/images/6/6_4.webp",
      "/images/6/6_5.webp",
      "/images/6/6_6.webp",
    ],
    landingImage: "/images/5/landing.webp",
    roomsHref: "/rooms#room_5",
  },

  /* ── Room 6 → room_6 ─────────────────────────────────────────────── */
  {
    id: "room_6",
    sku: "room_6",
    widgetRoomCode: "6",
    widgetRateCodeNR: "433885",
    widgetRateCodeFlex: "433896",
    rateCodes: {
      direct: { nr: "433885", flex: "433896" },
      ota: { nr: "614790", flex: "434402" },
    },
    occupancy: 7,
    pricingModel: "perBed",
    basePrice: { amount: 66.5, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 7, defaultRelease: 7 },
    imagesRaw: [
      "/images/6/landing.webp",
      "/images/6/6_1.webp",
      "/images/6/6_2.webp",
      "/images/6/6_3.webp",
      "/images/6/6_4.webp",
      "/images/6/6_5.webp",
      "/images/6/6_6.webp",
    ],
    landingImage: "/images/6/landing.webp",
    roomsHref: "/rooms#room_6",
  },

  /* ── Room 9 → room_9 ─────────────────────────────────────────────── */
  {
    id: "room_9",
    sku: "room_9",
    widgetRoomCode: "9",
    widgetRateCodeNR: "433886",
    widgetRateCodeFlex: "433897",
    rateCodes: {
      direct: { nr: "433886", flex: "433897" },
      ota: { nr: "614791", flex: "434403" },
    },
    occupancy: 3,
    pricingModel: "perBed",
    basePrice: { amount: 66.5, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 3, defaultRelease: 3 },
    imagesRaw: [
      "/images/9/landing.webp",
      "/images/9/9_1.webp",
      "/images/9/9_2.webp",
      "/images/9/9_3.webp",
      "/images/9/9_4.webp",
    ],
    landingImage: "/images/9/landing.webp",
    roomsHref: "/rooms#room_9",
  },

  /* ── Room 8 → room_8 ─────────────────────────────────────────────── */
  {
    id: "room_8",
    sku: "room_8",
    widgetRoomCode: "8",
    widgetRateCodeNR: "614934",
    widgetRateCodeFlex: "614933",
    rateCodes: {
      direct: { nr: "614934", flex: "614933" },
      ota: { nr: "614932", flex: "614929" },
    },
    occupancy: 2,
    pricingModel: "perRoom",
    basePrice: { amount: 78.0, currency: "EUR" },
    seasonalPrices: SEASONAL,
    availability: { totalBeds: 2, defaultRelease: 2 },
    imagesRaw: ["/images/8/landing.webp", "/images/8/8_1.webp"],
    landingImage: "/images/8/landing.webp",
    roomsHref: "/rooms#room_8",
  },
];

export default roomsData;
export { roomsData }; // ← named export for components that use a named import
