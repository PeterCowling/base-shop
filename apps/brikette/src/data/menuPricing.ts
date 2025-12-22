import type { AppLanguage } from "@/i18n.config";

const EURO_FORMATTERS = new Map<string, Intl.NumberFormat>();

const buildFormatter = (lang: AppLanguage): Intl.NumberFormat => {
  const locale = lang ?? "en";
  const cacheKey = locale.toLowerCase();
  const cached = EURO_FORMATTERS.get(cacheKey);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  EURO_FORMATTERS.set(cacheKey, formatter);
  return formatter;
};

const trimTrailingZeros = (amount: number): string => {
  if (Number.isInteger(amount)) {
    return amount.toString();
  }
  const fixed = amount.toFixed(2);
  return fixed.replace(/\.00$/, "").replace(/0$/, "");
};

const BAR_MENU_PRICES = {
  aperolSpritz: 10,
  limoncelloSpritz: 10,
  hugoSpritz: 11,
  rossiniSpritz: 11,
  lemonStrawberryDaiquiri: 10,
  lemonStrawberryMargarita: 12.5,
  lemonDropMartini: 12.5,
  redWhiteGlass: 5.5,
  redWhiteBottle: 20,
  proseccoGlass: 8,
  nastro330: 5,
  peroni330: 4.5,
  nastro660: 8,
  peroni660: 7,
  skyy: 8,
  absolut: 8,
  smirnoff: 10,
  greyGoose: 11,
  pampero: 8,
  bacardiSuperior: 8,
  captainMorgan: 11,
  angosturaReserva: 12.5,
  beefeater: 8,
  bombaySapphire: 10,
  tanqueray: 10,
  hendricks: 14,
  jwRed: 8,
  jameson: 11,
  jackDaniels: 11,
  wildTurkey: 11,
  chivas12: 14,
  glenfiddich12: 18,
  joseCuervoSilver: 8,
  limoncelloShot: 5.5,
  oneScoop: 2,
  twoScoops: 3,
  threeScoops: 3.5,
} as const;

const BREAKFAST_MENU_PRICES = {
  eggsCombo: 12.5,
  frenchToast: 12.5,
  nutellaFrenchToast: 14,
  pancakes: 12.5,
  addEggComboItem: 3,
  addAdditionalSyrup: 1.5,
  veggieToast: 10.5,
  healthyDelight: 10,
  detoxMe: 7,
  energizeMe: 7,
  multiV: 7,
  orangeJuice: 5,
  bananaSmoothie: 8,
  strawberrySmoothie: 8,
  saltedCaramelProteinSmoothie: 11,
  addProtein: 3,
  tea: 3,
  espresso: 2,
  macchiato: 3,
  americano: 3,
  cappuccino: 3.5,
  latte: 4,
  altMilk: 1.5,
  icedLatte: 5,
  icedSoyLatte: 6,
  icedRiceLatte: 6,
  icedTea: 4,
} as const;

export type BarMenuItemKey = keyof typeof BAR_MENU_PRICES;
export type BreakfastMenuItemKey = keyof typeof BREAKFAST_MENU_PRICES;

const formatPrice = (amount: number | undefined, lang: AppLanguage): string | undefined => {
  if (typeof amount === "number") {
    return buildFormatter(lang).format(amount);
  }
  return undefined;
};

const getPriceAmount = (amount: number | undefined): string | undefined => {
  if (typeof amount === "number") {
    return trimTrailingZeros(amount);
  }
  return undefined;
};

export const barMenuPrices = BAR_MENU_PRICES;
export const breakfastMenuPrices = BREAKFAST_MENU_PRICES;

export const formatBarMenuPrice = (key: BarMenuItemKey, lang: AppLanguage): string | undefined =>
  formatPrice(BAR_MENU_PRICES[key], lang);

export const formatBreakfastMenuPrice = (
  key: BreakfastMenuItemKey,
  lang: AppLanguage
): string | undefined => formatPrice(BREAKFAST_MENU_PRICES[key], lang);

export const getBarMenuPriceAmount = (key: BarMenuItemKey): string | undefined =>
  getPriceAmount(BAR_MENU_PRICES[key]);

export const getBreakfastMenuPriceAmount = (key: BreakfastMenuItemKey): string | undefined =>
  getPriceAmount(BREAKFAST_MENU_PRICES[key]);
