// src/config/hotel.ts
// ─────────────────────────────────────────────────────────────
// i18n-exempt file -- UI-1000 ttl=2026-12-31: Hotel config embeds per-locale content; migrate to @acme/i18n later.
import type { Hotel, RatingSource } from "@ui/types/machine-layer/ml.ts";
import { hotelSchema } from "@ui/types/schemas";
/** Official hostel contact e-mail. */
export const CONTACT_EMAIL = "hostelpositano@gmail.com" as const;

const ratings: RatingSource[] = [
  { provider: "Hostelworld", value: 9.3, count: 2_757, best: 10, worst: 1 },
  { provider: "Booking.com", value: 9.0, count: 579, best: 10, worst: 1 },
];

const hotel: Hotel = {
  id: "hostel-brikette",

  /* ── localisation ───────────────────────────────────────── */
  name: {
    en: "Hostel Brikette",
    de: "Hostel Brikette",
    es: "Hostel Brikette",
    hi: "हॉस्टल ब्रिकेट",
    fr: "Hostel Brikette",
    it: "Hostel Brikette",
    ja: "ホステル・ブリケット",
    ko: "호스텔 브리케테",
    pt: "Hostel Brikette",
    ru: "Хостел Брикете",
    zh: "布里凯特旅舍",
    vi: "Hostel Brikette",
    sv: "Hostel Brikette",
    ar: "بيت شباب بريكيت",
    pl: "Hostel Brikette",
    no: "Hostel Brikette",
    da: "Hostel Brikette",
    hu: "Hostel Brikette",
  },
  description: {
    en: "Positano's only hostel—cliff-top terraces with sweeping Amalfi Coast views, 100 m from the SITA bus stop.",
    de: "Das einzige Hostel in Positano – Panoramaterrassen mit Blick auf die Amalfiküste, 100 m von der SITA-Bushaltestelle entfernt.",
    es: "El único albergue de Positano, con terrazas en lo alto del acantilado y vistas panorámicas de la Costa Amalfitana, a 100 m de la parada de autobús SITA.",
    hi: "पोज़ितानो का एकमात्र हॉस्टल—चट्टान की चोटी पर स्थित टैरेस से अमाल्फी तट का विहंगम दृश्य, SITA बस स्टॉप से 100 मीटर।",
    fr: "Seul hostel de Positano : terrasses perchées offrant une vue imprenable sur la côte amalfitaine, à 100 m de l'arrêt de bus SITA.",
    it: "L'unico ostello di Positano: terrazze panoramiche a picco sul mare e fermata SITA a 100 m.",
    ja: "ポジターノ唯一のホステル。崖上のテラスからアマルフィ海岸を一望。SITAバス停まで徒歩1分。",
    ko: "포지타노 유일의 호스텔—절벽 위 테라스에서 아말피 코스트 전경, SITA 버스 정류장까지 100 m.",
    pt: "O único hostel de Positano – terraços no topo do penhasco com vistas da Costa Amalfitana, a 100 m da paragem de autocarro SITA.",
    ru: "Единственный хостел в Позитано: террасы на скале с панорамой Амальфитанского побережья, в 100 м от остановки автобуса SITA.",
    zh: "波西塔诺仅有的青年旅舍，峭壁海景露台，可俯瞰阿马尔菲海岸，距 SITA 公交站 100 米。",
    vi: "Ký túc xá duy nhất của Positano—sân thượng trên vách đá với tầm nhìn toàn cảnh Bờ biển Amalfi, cách điểm dừng xe buýt SITA 100 m.",
    sv: "Positanos enda vandrarhem – terrasser på klippkanten med vid utsikt över Amalfikusten, 100 m från SITA-busshållplatsen.",
    ar: "بيت الشباب الوحيد في بوزيتانو — شرفات على قمّة الجرف بإطلالات بانورامية على ساحل أمالفي، على بُعد 100 متر من موقف حافلات SITA.",
    pl: "Jedyny hostel w Positano — tarasy na klifie z panoramicznym widokiem na Wybrzeże Amalfitańskie, 100 m od przystanku autobusowego SITA.",
    no: "Positanos eneste hostel – klippeterrasser med vid utsikt over Amalfikysten, 100 m fra SITA-bussstoppet.",
    da: "Positanos eneste hostel – klippeterrasser med panoramaudsigt over Amalfikysten, 100 m fra SITA-busstopstedet.",
    hu: "Positano egyetlen hostele – sziklatetői teraszok lenyűgöző amalfiparti kilátással, 100 m-re a SITA buszmegállótól.",
  },

  /* ── contacts ───────────────────────────────────────────── */
  url: "https://www.hostel-positano.com",
  email: CONTACT_EMAIL,

  /* ── address ─────────────────────────────────────────────── */
  address: {
    streetAddress: "Via Guglielmo Marconi 358",
    addressLocality: "Positano SA",
    postalCode: "84017",
    addressCountry: "IT",
  },
  geo: { lat: 40.629634, lng: 14.480818 },

  /* ── amenities (UI + JSON-LD) ───────────────────────────── */
  amenities: [
    { name: "Free Wi-Fi", icon: "wifi" },
    { name: "Air Conditioning", icon: "snowflake" },
    { name: "Panoramic Terrace", icon: "sun" },
    { name: "Bar & Café", icon: "cocktail" },
    { name: "Secure Lockers", icon: "lock" },
    { name: "Concierge / Digital Assistant", icon: "assistant" },
    { name: "Luggage Storage", icon: "briefcase" },
  ],

  /* ── opening & key times ────────────────────────────────── */
  openingHours: [{ dayRange: "Mon-Sun", opens: "00:00", closes: "23:59" }],
  checkin: { from: "15:30", until: "22:30" },
  checkout: { by: "10:30" },

  /* ── payment options shown to guests ────────────────────── */
  acceptedPayments: ["Cash", "Visa", "Mastercard", "Maestro"],

  /* ── external profiles ──────────────────────────────────── */
  sameAs: [
    "https://maps.google.com/maps?cid=17733313080460471781",
    "https://maps.apple.com/?q=Hostel+Brikette&ll=40.629634,14.480818",
    "https://www.instagram.com/brikettepositano",
  ],

  priceRange: "€55 – €300",
  ratings,
};

export default hotelSchema.parse(hotel);
